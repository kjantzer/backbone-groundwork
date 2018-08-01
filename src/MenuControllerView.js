/*
    Menu Controller View

    First used in conjuction with MenuController, but this may prove useful in other areas.
    If that is the case, a class renaming may be in order.

    Aside from methods used by MenuController, this view also adds support for 'actions'
    which is effectively a toolbar with buttons. Action buttons work just like View/SheetView
    toolbar buttons.

    Buttons can be simple `onClick` or more complex nested dropdowns.

    The layout of the actions toolbar can be adjusted to appear: top, bottom, left, or right.

    @author Kevin Jantzer, Blackstone Audio
    @since 2015-07-09

    TODO
    - Add themeing when the need arises
    - Make view useable outside of MenuController? (calling of `setupView` will need to be adjusted)
*/

let View = require('./View')
let Util = require('./Util')

module.exports = Backbone.View.extend({

    //rootView: function(){ return new Backbone.View },

    //actionsLayout: 'bottom', // top, bottom, left, right

    // actionSounds: false,
    /*actions: [{
        label: 'Button Label',
        title: 'Click this button to take an action', // title that appears on hover
        icon: 'user-add',
        className: 'blue ghost',
        onClick: 'someAction' // name of method on the class
    }],*/

    // default method, feel free to override
    setModel: function(model){

        if( this.model )
            this.stopListening(this.model)

        this.model = model;

        if( this.editor )
            this.editor.setModel(model)

        if( this.view && this.view.setModel )
            this.view.setModel(model)

        _.each(this.__subviews, function(view){
            if( view && view.setModel )
                view.setModel(model)
        })

        this.setListeners();

        return this;
    },

    setListeners: function(){
        // nothing to do.
    },

    isVisible: function(){
        return this.$wrap && this.$wrap[0].classList.contains('show')
    },

    reRender: function(){
        if( this.isVisible() && this.inDOM() )
            this.render();
    },

    render: function(){

        this._setupView(); // setup view, root view and actions if this has not been done already (MenuConroller will call this for us)

        var args = arguments;

        if( this.view || _.size(this.views) > 0 )
            _.defer(function(){
                View.prototype.forEachView.call(this, function(view){
                    view.render.apply(view, args)
                })
                // this.view.render.apply(this.view, args)
            }.bind(this));
            
        else if( this.template )
            this.renderTemplate()

        return this;
    },

    spin: function(doSpin){
        this.trigger('spin', doSpin);
    },

    _setupView: function(){

        if( this.$wrap ) return;

        this.$wrap = $('<div class="af-menu-view-wrap"></div>');

        this.$el.appendTo(this.$wrap);

        this._setupRootView(); // setup root view if one given
        this._setupActions();

        return this;
    },

    appendTo: function($el){
        if( this.$wrap )
            $el.append(this.$wrap);
        else
            console.warn("`_setupView` has not been called yet. use `render` first")
    },

    _setupRootView: function(){
        
        View.prototype._setupRootView.apply(this, arguments)

        // var rootView = this.options.rootView || this.rootView;
        // 
        // if( rootView && !this.view ){
        //     this.view = typeof rootView == 'function' ? rootView.call(this) : rootView;
        //     this.view.parentView = this;
        //     this.view.on('spin', this.spin, this);
        // 
        //     if( this.view.el !== this.el )
        //         this.$el.append( this.view.el );
        // }
    },

    _setupActions: function(){

        if( !this.actions || this.$actions || !this.$wrap) return;

        (this.$actions = this.$actions || $('<div class="af-menu-view-actions no-selection"></div>')).appendTo(this.$wrap)

        var self = this;

        this.actions.forEach(function(action){

            if( action.header ){
                self.$actions.append(`<h3 class="action-header ${action.className}">${action.header}</h3>`)
                return;
            }

            action.sound = action.sound || self.actionSounds
            Util.addBtn.call(self, action, self.$actions)

        })

        this.$wrap.addClass('actions-'+(this.actionsLayout||'bottom'))
    },

    _show: function(){
        this.render().$wrap.addClass('show')
    },

    _hide: function(){
        this.$wrap.removeClass('show')
    },

    scrollToElement: function(el, animated){
        this.scrollTo(el.offsetTop);
    },

    scrollTo: function(offset){
        this.el.scrollTop = offset;
    },

})
