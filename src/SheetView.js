/*
    Sheet View

    A view that stacks on top of the active main view like "sheets"
    Many sheets can be opened at once (but only one will be useable)
    All sheets will be closed when a new "main" view is loaded

    Closing a sheet will also close any sheets above it.

    A SheetView performs just like the normal App.View

    SheetView.open() will also trigger .render()

    @author Kevin Jantzer
    @since 2013-04-12

    NOTES
    - would be interesting to allow for resizing of view (http://codepen.io/zz85/pen/gbOoVP)

*/

let View = require('./View')
let Util = require('./Util')

let SheetView = View.extend({

    //controller: App.SheetsController instance; set by App.js

    // what to put in the hash
    hashName: function(){
        return (this.parentView&&this.parentView.viewName?this.parentView.viewName+'/':'')+(this.viewName||''); // viewName would be set by `.subview()`
    },

    setTitleOnOpen: false,
    showCloseBtn: true,
    w: false,			// can set width of
    h: false,
    centered: false, 	// width required for this
    toolbarStyle: '',	// white
    sheetClassName: '',

    onOpen: function(){},
    onClose: function(){},
    onOpened: function(){},
    onClosed: function(){},
    //setModel: function(){},
    //setCollection: function(){},
    
    setTitle: function(){
        if( this.isOnTop() )
            this.controller.setHash();
            
        View.prototype.setTitle.apply(this, arguments);
    },

    setPath: function(path){

        if( !path ){
            this.__path = null;
            return;
        }

        if( _.isString(path ))
            path = path.replace(/^\/|\/$/g, '').split('/');

        if( path.length == 0) path = null;

        this.__path = path;
        if( this.view )
            this.view.__path = path;
    },

    // will always return an array
    getPath: function(){
        let match = location.hash.match(RegExp('^#'+this.viewName+'\/?(.*)'))
        return match && match[1] ? match[1].split('/') : []
    },

    open: function(model, path){

        this.setPath(path);

        if( model && model instanceof Backbone.Model && this.setModel )
            this.setModel(model);

        else if( model && model instanceof Backbone.Collection && this.setCollection )
            this.setCollection(model);

        this.setHeight('')

        if( this.isSplitView )
            this.isSplitView = false;

        // allow onOpen to cancel the opening of this view
        if( this.onOpen.apply(this, arguments) !== false )
            this.controller.open(this);
    },
    
    isOnTop: function(){
        return this.controller && (this.controller.sheets.length - 1) == this.index
    },

    openInside: function(model, sheetView){

        // backwards compatibility
        if( arguments.length == 1){
            sheetView = model;
            model = null;
        }

        if( !this.splitView ) return console.warn('Split view not allowed. Please add `splitView` to your view');

        if( !sheetView || (!sheetView instanceof SheetView) && sheetView !== this )
            return console.warn('No sheetView given');

        this.open(model);

        this.isSplitView = true;

        sheetView.$el.append( this.$sheet );

        this.setHeight()
    },

    setHeight: function(h){

        if( !this.isSplitView ) return;

        if( typeof h === 'undefined' )
            h = this.splitView.h || '40%'

        this.$sheet.height(h);

        this.trigger('splitview:height', h);
    },

    close: function(){

        if( !this.isOpen) return;
        
        if( Util.isFullscreen(this.$sheet[0]) ){
            Util.toggleFullscreen()
            return;
        }

        this.onClose.apply(this, arguments)

        this.controller.close(this);
    },

    _open: function(){

        this.isOpen = true;
        this.$sheet.addClass('open')

        if( this.setTitleOnOpen && this.isOpen )
            this.setTitle(this.setTitleOnOpen());

        this.realtimeOpen();
        this.onOpened()
    },

    realtimeOpen: function(){
        // if realtime view tracking is enabled, set this view as OPEN for this user
        if( this.realtimeViewID && typeof realtime !== 'undefined' ){

            var viewID = _.isFunction(this.realtimeViewID)?this.realtimeViewID():this.realtimeViewID;

            realtime.viewOpen(viewID)

            // updating listening key on connection badge
            var _key = 'view:'+viewID+':connections';
            this.subview('realtimeConnectionsBadge') && this.subview('realtimeConnectionsBadge').updateListenTo(_key)
        }
    },

    realtimeClose: function(){
        // if realtime view tracking is enabled, set this view as CLOSED for this user
        if( this.realtimeViewID && typeof realtime !== 'undefined'){

            realtime.viewClose(_.isFunction(this.realtimeViewID)?this.realtimeViewID():this.realtimeViewID)
        }
    },

    _close: function(){

        this.setHeight('');
        this.isOpen = false;
        this.isSplitView = false;
        this.$sheet.removeClass('open')

        this.cleanup(); // cleanup this view and any subviews that need it

        this.realtimeClose();
        
        this.onClosed()

        setTimeout(_.bind(function(){

            this.$sheet.detach();

        },this), this.controller.SPEED);

    },

    _renderView: function(){

        if( !this.$sheet ) this._setView();

        // detach so we can keep events bound
        this.$toolbar && this.$toolbar.detach();
        this.$el.detach();

        this.$_toolbar.html( this._renderToolbar().$toolbar )
        this.$_inner.html( this.render().$el );

        return this;
    },

    _setView: function(){
        this.$sheet = $('<div class="sheet '+(this.isFullscreen?'fullscreen':'')+' '+this.sheetClassName+'"><div class="wrap">\
                    <div class="af-toolbar toolbar clearfix no-selection"></div>\
                    <div class="af-inner inner"></div>\
                </div></div>');

        if( this.w )
            this.$sheet.addClass('manual-width').css({width: this.w+'px'})

        if( this.h )
            this.$sheet.addClass('manual-height').css({height: this.h+'px'})

        if( this.centered || this.h )
            this.$sheet.addClass('centered')

        if( this.toolbarStyle )
            this.$sheet.addClass('toolbar-'+this.toolbarStyle);

        this.$_toolbar = this.$sheet.find('.toolbar');
        this.$_inner = this.$sheet.find('.inner');

        // this.$_toolbar[0].addEventListener('dblclick', this.toggleFullscreen.bind(this) )
    },

    toggleFullscreen: function(){

        this.isFullscreen = !this.isFullscreen

        if( this.$sheet )
            this.$sheet[0].classList.toggle('fullscreen');

        this.controller.toggleFullscreen(this);
    },

    fullscreen: function(yes){

        this.isFullscreen = yes !== false;

        if( this.$sheet )
            this.isFullscreen ? this.$sheet[0].classList.add('fullscreen') : this.$sheet[0].classList.remove('fullscreen');
    },
    
    toggleFullscreenAPI: function(){
        Util.toggleFullscreen(this.$sheet[0]/*, this.fullscreen.bind(this)*/)
    },

    updateTitle: function(){
        if( !this.setTitleOnOpen )
            console.warn('Cannot update title. Please provide a `setTitleOnOpen` method.')
        else
            this.setTitle(this.setTitleOnOpen())
    },

    // override default spin...sheet views will spin in the center
    spin: function(keepSpinning, cancelCallback){

        //make sure we have a view (sop dashboard broke)
        if(!this.$_inner)
            this._setView();
        if(keepSpinning === false){

            var spinner = this.$_inner[0].querySelector('.spinner');
            if( spinner ) spinner.removeEventListener('click', null)
            this.$_inner.spin(false)
            this.$_inner[0].classList.remove('spinner-cancel')

        }else{
            this.$_inner.spin()

            if( cancelCallback ){
                this.$_inner[0].classList.add('spinner-cancel')
                var spinner = this.$_inner[0].querySelector('.spinner');
                if( spinner ) spinner.addEventListener('click', cancelCallback)
            }
        }
    },

});

module.exports = SheetView