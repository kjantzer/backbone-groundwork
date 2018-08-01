/* ==============================
    Base View

    view with toolbar
*/

let Sounds = require('./Sounds')

module.exports = Backbone.View.extend({

    title: 'App View',

    btnSounds: false,
    showCloseBtn: false,
    showSaveBtn: false, // if true, close btn changes to "cancel button"
    progressType: 'normal', // 'percent'
    summaryChangeEvents: 'count:change filter:change filter:search',
    summaryTemplate: null, // also requires collection with `summaryData()` method

    //realtimeViewID: null, // the view key
    realtimeBadgeAppendTo: function(){
        return this.$toolbar.find('.tool-title')
    },

    hasSummary: function(){
        return this.summaryTemplate
    },

    initialize: function(){
        
        this._setupRootView()

        if( this.model && this.setModel )
            this.setModel(this.model)

        if( this.collection && this.setCollection )
            this.setCollection(this.collection)
    },

    render: function(){

        this._setupRootView();

        var args = arguments;
        _.defer(()=>{
            this.forEachView(view=>view.render.apply(view, args))
        });

        return this;
    },
    
    forEachView: function(fnAction){
        if( fnAction )
        _.each(this.views, function(v, vName){
            this.sv(vName) && fnAction(this.sv(vName))
        }.bind(this))
    },

    // DEPRECATED - this type of logic is being ported to backbone.subviews
    // but a lot of refactoring needed to start using `renderViews`
    _setupRootView: function(){

        if( this.__rootViewsSetup ) return;
        this.__rootViewsSetup = true;
        
        // not sure I want to do this
        if( this.rootViews )
        _.each(this.rootViews, (v, viewName)=>{
    
            if( !v.view ) return;
    
            this._setSubview(viewName, v.view);
    
            if( viewName == location.hash.slice(1).split('/')[0] ){
                setTimeout(()=>this.openSubview(viewName), 500)
            }
        })
        
        var views = this.views || {};
        
        // let root and sidebar views be overridden in init options
        if( this.options.rootView ){ views.view = this.options.rootView }
        if( this.options.sidebarView ){ views.sidebar = this.options.sidebarView }
        
        // legacy support
        // ~NOTE: `_view` is deprectated - please use `rootView`~
        if( !views.view && (this._view || this.rootView) ){
            views.view = this._view || this.rootView
        }
        
        if( !views.sidebar && this.sidebarView ){
            views.sidebar = this.sidebarView
        }
        
        this.views = views;

        // init each view
        _.each(views, function(v, vName){

            // special init for root view
            if( vName == 'view' && !this.view ){
                // FIXME
                this.view = typeof v == 'function' ? v.call(this) : v;

                this.sv(vName, this.view);

                this.view.parentView = this;
                this.view.on('spin', this.spin, this);
                
                if( this.view.appendTo )
                    this.view.appendTo(this.$el)
                else
                    this.$el.append( this.view.$wrap || this.view.el );
                    
                this._setupMethods&&this._setupMethods(); // deprectated

                if( this.hasSummary && this.hasSummary() && this.summaryChangeEvents )
                    this.listenTo(this.view, this.summaryChangeEvents, this._updateSummary)
            }
            
            // init all other NON-root views
            if( vName != 'view' && !this.sv(vName) ){
                this.sv(vName, (v.prototype.render ? new v({model:this.model}) : v.call(this)));
                this.$el.append( this.sv(vName).el );
            }
    
            // let others hook into the setup
            this.onViewSetup && this.onViewSetup(vName, this.sv(vName))
    
        }.bind(this))
    },

    // ! DEPRECATED
    _setupMethods: function(){

        if( this.methods && !this._didSetupMethods ){

            var proto = Object.getPrototypeOf(this);

            proto._didSetupMethods = true;

            _.each(this.methods, function(methodName){

                if( this[methodName] )
                    console.warn('Whoops! Looks like this SheetView already has a method called: “'+methodName+'”');
                else if( !this.view[methodName] )
                    console.error('The root view for this SheetView does not have a method called: “'+methodName+'”');
                else
                    proto[methodName] = function(){ this.view[methodName].apply(this.view, arguments); }.bind(this)

            }.bind(this))
        }
    },

    _renderToolbar: function(){

        if( !this.$toolbar )
            this.$toolbar = $('<div class="'+this.className+'"></div>');

        this.$toolbar.empty();

        this.$toolbar.append( this.toolbarTitle() );

        if( this.realtimeViewID )
            this.renderRealtimeConnectionsBadge()

        if(this.renderToolbar)
            _.defer(this.renderToolbar.bind(this));

        var toolbarTitleMenu = _.isFunction(this.toolbarTitleMenu) ? this.toolbarTitleMenu() : this.toolbarTitleMenu;

        if( toolbarTitleMenu && toolbarTitleMenu.view ){
            this.toolbarTitleMenuDD = new Dropdown( Object.assign({
                renderTo: this.$toolbar.find('h4')
            }, toolbarTitleMenu) )
            // this.$toolbar.find('h4').dropdown(toolbarTitleMenu.view, toolbarTitleMenu);

        }/*else if( this.sections){
            this.$toolbar.find('.section-heading').dropdown(this.sectionMenu(), this.sectionMenuSettings());
        }*/

        if( this.showSaveBtn )
            $('<a class="btn green left close-sheet">Save</a>')
                .appendTo(this.$toolbar)
                .click( this.save.bind(this) )

        if( this.showCloseBtn && !this.showSaveBtn )
            $('<a class="btn left close-sheet icon-cancel"></a>')
                .appendTo(this.$toolbar)
                .click(()=>{
                    this.btnSounds&&Sounds.play(this.btnSounds===true?'appear':this.btnSounds, 0.25)
                    this.close()
                })
                    

        else if( this.showCloseBtn && this.showSaveBtn )
            $('<a class="btn left close-sheet">Cancel</a>')
                .appendTo(this.$toolbar)
                .click( this.cancel.bind(this) )

        // render buttons (if any defined)
        _.defer(this._renderBtns.bind(this));

        return this;
    },

    _renderBtns: function(){

        if( this.btns )
            var btns = _.isFunction(this.btns) ? this.btns() : this.btns;
            _.each(btns, function(btn){
                
                btn.sound = btn.sound || this.btnSounds

                if( btn == 'divider' || btn.divider != undefined )
                    this.$toolbar.append('<div class="btn-divider '+(btn.className||'')+'"></div>')
                else if( btn.group )
                    this._renderBtnGroup(btn)
                else
                    App.Util.addBtn.call(this, btn, (btn.titleBtn == true ? this.$toolbar.find('h4') : this.$toolbar))
            }.bind(this));

        if( this.hasSummary() ){
            this.$summary = $('<div class="summary right"></div>').appendTo(this.$toolbar)
            this._updateSummary()
            
            if( this.summaryEvents ){
            
              // copied from: https://cdn.rawgit.com/jashkenas/backbone/0.9.9/docs/backbone.html
              for (var key in this.summaryEvents) {
                var method = this.summaryEvents[key];
                if (!_.isFunction(method)) method = this[this.summaryEvents[key]];
                if (!method) throw new Error('Method "' + this.summaryEvents[key] + '" does not exist');
                var match = key.match(/^(\S+)\s*(.*)$/);
                var eventName = match[1], selector = match[2];
                method = _.bind(method, this);
                eventName += '.delegateEvents' + this.cid;
                if (selector === '') {
                  this.$summary.bind(eventName, method);
                } else {
                  this.$summary.delegate(selector, eventName, method);
                }
              }
                
            }
            
        }
    },

    _renderBtnGroup: function(btnGroup){
        $group = $('<span class="btn-group '+(btnGroup.className||'')+'"></span>')
        btnGroup.group.forEach(function(btn){
            App.Util.addBtn.call(this, btn, $group)
        }.bind(this))
        
        if( btnGroup.titleBtn ){
            this.$toolbar.find('h4').append($group)
        }else{
             this.$toolbar.append($group)
        }
    },

    _btnPresets: {
        'close': {
            className: 'icon-cancel left close-sheet',
            onClick: 'close'
        },
        'cancel': {
            label: 'Cancel',
            className: 'left close-sheet',
            onClick: 'close'
        },
        'fullscreen': {
			icon: 'resize-full',
			className: 'transparent right',
			title: 'Toggle fullscreen',
			onClick: 'toggleFullscreenAPI'
		}
    },

    save: function(){

        if( this.view && this.view.save ){
            if( this.view.save() === true )
                this.close();

        }else if( this.editor ){

            var success = (this.model.isNew() && this.collection )
                        ? function(){
                            this.collection.add(this.model);
                        }.bind(this)
                        : null;

            this.editor.save(null, {success: success});

            this.close();
        }
    },

    cancel: function(){
        this.close();
    },

    toolbarTitle: function(){

        if( !this.title)
            return '';

        return '<h4 class="tool-title'+(this.icon?' icon-'+this.icon:'')+'"><span>'+this.title+'</span></h4>'; //<span class="section-heading">Section</span>
    },

    renderRealtimeConnectionsBadge: function(){

        // realtime not yet defined, retry in 300 ms
        if( typeof realtime == 'undefined'){
            setTimeout(this.renderRealtimeConnectionsBadge.bind(this), 300);

        }else{
            this.subview('realtimeConnectionsBadge', new BSA.Views.RealtimeConnectionsBadge(
                {realtimeKey: 'view:'+(_.isFunction(this.realtimeViewID)?this.realtimeViewID():this.realtimeViewID)+':connections'}))

            this.realtimeBadgeAppendTo().append( this.subview('realtimeConnectionsBadge').render().el )
        }
    },

    toolbarTitleMenu: function(){
        return false;
    },

    setTitle: function(title){
        this.$toolbar && this.$toolbar.find('h4.tool-title > span:first-child').html(title);
    },

    showToolbarTitleMenu: function(){
        this.toolbarTitleMenuDD.open()
        // this.$toolbar.find('h4').data('dropdown').open();
    },

    hideToolbarTitleMenu: function(){
        this.toolbarTitleMenuDD.close()
        // this.$toolbar.find('h4').data('dropdown').close();
    },
    
    toggleToolbarTitleMenu: function(){
        this.toolbarTitleMenuDD.toggle()
        // this.$toolbar.find('h4').data('dropdown').toggle();
    },

    openToolbarTitleMenu: function(){ this.showToolbarTitleMenu(); },
    closeToolbarTitleMenu: function(){ this.hideToolbarTitleMenu(); },

    spin: function(keepSpinning){

        if( !this.$toolbar ) return;

        if(keepSpinning === false)
            this.$toolbar.spin(false)
        else
            this.$toolbar.spin('small')
    },

    cleanup: function(){

        var scrollView = this.scrollView();

        if( scrollView )
            this.scrollTop = scrollView.scrollTop;

        // call default cleanup method
        Backbone.View.prototype.cleanup.apply(this, arguments);
    },

    scrollView: function(){
        return this.el.parentElement;
    },

    scrollToElement: function(id, animated){

        var el = typeof id == 'object' ? id : document.getElementById('section-'+id);

        if( !el ) return console.warn('Could not find section: ', section)

        this.scrollTo(el.offsetTop);

    },

    scrollTo: function(offset, animated){

        animated = animated === false ? false : true;

        var scrollView = this.scrollView();

        if( !scrollView ) return console.warn('Could not find scrollview: ', scrollView)

        if( animated )
            scrollView.smoothScrollTo(offset);
        else
            scrollView.scrollTop = offset;

    },


/*
    Progress - sets progress bar in the view toolbar; when both counts are equal, the progressbar will hide
*/
    progress: function(count, loadedCount, showPercent){

        if( isNaN(count) || isNaN(loadedCount) ) return;

        if( showPercent !== false && showPercent !== true && this.progressType == 'percent')
            showPercent = true;

        // if the progress bar elements have not been created, create them now.
        if( !this.$progressbar ){
            this.$progressbar = $('<div class="progressbar">\
                                        <div class="progressbar-outer">\
                                            <div class="progressbar-inner"></div>\
                                        </div>\
                                        <div class="progressbar-count"></div>\
                                    </div>').appendTo(this.$toolbar);

            this.$progressbarInner = this.$progressbar.find('.progressbar-inner');
            this.$progressbarCount = this.$progressbar.find('.progressbar-count');
        }


        if( loadedCount >= count ){
            this.$el.attr('data-progress', null);
            this.$progressbar.hide();
            return;
        }

        var percent = _.nearestQuarter( loadedCount/count * 100);

        this.$el.attr('data-progress', percent);

        this.$progressbar.show();
        this.$progressbarInner.width( percent+'%')

        if( showPercent )
            this.$progressbarCount.html('<span>Loading ('+percent + '%)</span>');
        else
            this.$progressbarCount.html('<span>Loading '+loadedCount + ' of '+count+'</span>');

        return percent;
    },

    _updateSummary: function(){

        if( !this.$summary ) return;

        var data;

        if( this.summaryData ){
            data = this.summaryData()
        }else{
            var coll = this.view && this.view.getCurrentCollection ? this.view.getCurrentCollection() : this.collection;
            if( !coll ) return this.$summary.empty();
            data = coll.summaryData()
        }

        if( data )
        this.$summary.html( _.template(this.summaryTemplate, data) );
    }

});



// http://codereview.stackexchange.com/a/13118
function animation(effectFrame, duration, from, to, easing, framespacing) {
    var start = Date.now(), change;

    if (animation.existing) {
    window.clearTimeout(animation.existing);
    }

    duration = duration || 1000;
    if (typeof from === 'function') {
    easing = from;
    from = 0;
    }
    easing = easing || function(x, t, b, c, d) { return c * t / d + b; };
    from = from || 0;
    to = to || 1;
    framespacing = framespacing || 1;
    change = to - from;

    (function interval() {
    var time = Date.now() - start;
     if (time < duration) {
        effectFrame(easing(0, time, from, change, duration));
        animation.existing = window.setTimeout(interval, framespacing);
    } else {
        effectFrame(to);
    }
    }());
}
Element.prototype.smoothScrollTo = function (target, duration) {
    var el = this;
    var start = el.scrollTop;

    duration = duration || 400;

    var fn = function (position) { el.scrollTop = position; }

    animation(fn, duration, start, target);
};
