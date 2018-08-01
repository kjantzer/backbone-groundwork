/*
    Menu Controller

    Given an array of views, this will create a menu (either horizontal or vertical)
    and render each view appropriately.

    Contains support for passing `setModel` and `setCollection` from parent view
    to each child view.

    @author Kevin Jantzer, Blackstone Audio
    @since 2015-07-07
*/

let MenuControllerView = require('./MenuControllerView')
let Util = require('./Util')
let Sounds = require('./Sounds')

module.exports = Backbone.View.extend({

    layout: 'vert', // vert or horz
    wrap: false,
    menuSounds: false,
    allowOrdering: false,
    //orderKey: '' // if not set, className will be used
    
    // override to provide custom order storage
    menuOrder: function(newOrder){
        var orderKey = 'MenuController:Order:'+(this.orderKey || this.className || this.__className)
        if( newOrder !== undefined ){
            _.store(orderKey, newOrder)
        }
        return _.store(orderKey)
    },

    /*views: [{
        label: 'Menu Label',
        permission: null,
        displayIf: null, // string ('new' or 'not-new') or function
        icon: 'user',
        view: DetailsView,
        dropdown: null		// optional dropdown (added to menu item)

        // TODO
        hash: 'menu-label', // defaults to _.slugify(this.label) // hash feature not used yet
    }],*/


    // class and events to always exist on the controller
    __className: 'af-menu-controller',
    __events: {
        'click > .af-menu > li': '_onMenuClick',
        'contextmenu > .af-menu > li.has-action-menu': '_onMenuContextMenu'
    },

    constructor: function(){
        this.events = _.extend({}, this.__events, this.events||{});
        Backbone.View.prototype.constructor.apply(this, arguments);
    },

    render: function(){
        this._setupViews();
        this.loadView(); // will load view based on "path" or rerender active view
        this.delegateEvents();
        return this;
    },

    setModel: function(model){
        this.model = model;
        this.setViewModels()
    },

    setCollection: function(coll){
        this.collection = coll;
        this.setViewCollections()
    },

    setViewModels: function(model){
        model = model || this.model;
        this.views.forEach(function(v){
            v.View && v.View.setModel && v.View.setModel(model);
        })
    },

    setViewCollections: function(coll){
        coll = coll || this.collection;
        this.views.forEach(function(v){
            v.View && v.View.setCollection && v.View.setCollection(coll);
        })
    },

    _setupViews: function(){

        if( this.__viewsSetup ) return; // only setup once

        if( !this.views || this.views.length <= 0 ){
            console.warn('Please set an array of views for the MenuController');
            return;
        }

        this.$el.addClass(this.__className);

        (this.$views = this.$views || $('<div class="af-menu-views"></div>')).appendTo(this.$el)

        this.views.forEach(function(d, indx){

            d.hash = d.hash || _.slugify(d.label)

            var v = d.View = (this.subview(d.hash||d.label||d.icon) || this.subview(d.hash||d.label||d.icon, new d.view({
                model: this.model,
                collection: this.collection
            })))

            v.viewIndex = indx;

            // when view requests a spinner, show/hide a spinner on the menu
            this.listenTo(v, 'spin', this._onViewSpin.bind(this, v))

            if( v.setModel )
                v.setModel(this.model)

            if( v instanceof MenuControllerView )
                this.$views.append( v._setupView().$wrap );
            else
                this.$views.append( v.el );

        }.bind(this))

        this._setupMenu();

        this.__viewsSetup = true;

        this.loadView();
    },

    _onViewSpin: function(view, doSpin){
        var v = this.views[view.viewIndex];

        if( !v || !v.$menu) return;

        doSpin === false ? v.$menu.spin(false) : v.$menu.spin('small');
    },

    _setupMenu: function(){

        (this.$menu = this.$menu || $('<ul class="af-menu"></ul>')).prependTo(this.$el)

        this.$el.addClass(this.layout+'-menu')

        if( this.wrap )
            this.$el.addClass('af-menu-wrap')

        this.views.forEach(function(d, indx){

            // defermine if the menu should be displayed
            if( d.displayIf && !Util.displayIf.call(this, d.displayIf) )
                return;

            // dont add menu if user does not have permission
            if( d.permission && !Util.permission(d.permission) ){
                d.permissionDenied = true
                return;
            }

            if( !d.label && !d.icon ){
                // will render the view as the menu
                return;
            }

            d.$menu = $('<li data-indx="'+indx+'" oncontextmenu="return false;" class="no-selection">\
                            <a class="'+(d.icon?'icon-'+d.icon:'')+'"><span class="af-menu-label">'+(d.label||'')+'</span></a>\
                        </li>')

            if( d.attrs )
                d.$menu.attr(d.attrs);

            if( d.dropdown )
                d.$menu.addClass('has-action-menu');

        }.bind(this))
        
        if( this.allowOrdering ){
            
            if( $.fn.sortable ){
                this.$menu.sortable({
                    axis: this.layout == 'vert' ? 'y' : 'x',
                    containment: 'parent',
                    revert: true,
                    tolerance: 'pointer',
                    distance: 5, // deprecated in 1.12
                    update: function(event, ui){
                        var newOrder = Array.from(ui.item[0].parentElement.childNodes).map(el => el.dataset.indx)
                        this.menuOrder(newOrder)
                    }.bind(this)
                })
            }else{
                console.warn('Menu Controller: cannot activate ordering; `jQuery.sortable` not found.')
            }
        }
        
        this._renderMenu()
    },
    
    _resetMenuOrder: function(){
        this.menuOrder(null)
        this._renderMenu()
    },
    
    _renderMenu: function(){
        var menuOrder = this.menuOrder()
        
        // insert menu in order saved
        if( menuOrder ){
            menuOrder.forEach(indx => this.views[indx] && this.views[indx].$menu && this.views[indx].$menu.appendTo(this.$menu) )
            // insert any remaining views (new views since last saved order)
            this.views.forEach((d, indx) => menuOrder.indexOf(String(indx)) == -1 && d.$menu && d.$menu.appendTo(this.$menu) )
            
        // insert views in order they are defined
        }else{
            this.views.forEach(d =>{
                if( d.$menu )
                    d.$menu.appendTo(this.$menu) 
                else if( d.permissionDenied !== true ) // permission denied views wont have a $menu
                    this.$menu.append( d.View.render().el )
            })
        }
    },

    _onMenuContextMenu: function(e){

        var indx = e.currentTarget.dataset.indx
        var v = this.views[indx];

        // no view found, or current view is not the active one
        if( !v || indx != this._activeView() )
            return true;

        if( v.dropdown && v.dropdown.view ){
            v.dropdown.context = v.View;
            v.dropdown.trigger = 'none';
            v.dropdown.align = v.dropdown.align || 'bottomRight';
            v.dropdown.autoCenter = true;
            v.$menu.dropdown(v.dropdown.view, v.dropdown)
        }
    },

    viewForHash: function(name){
        return this.views.filter(function(v){ return v.hash == name })[0];
    },
    
    active: function(key){
        if( key == 'view' ) key = 'View' // no need to allow getting the uninitizlied view
        let d = this.views[this._activeView()]
        return key ? d[key] : d
    },

    hashForActiveView: function(){
        var view = this.views[this._activeView()]
        var hash = view.hash;
        if( view && view.View && view.View.hashForActiveView )
            hash += '/'+view.View.hashForActiveView();
        return hash;
    },

    loadView: function(indx){

        if( !this.views ) return;
        
        if( typeof indx == 'undefined' ){

            // if a path is given (from the parent view) then see if there is a view with that path name
            // __path will be an array and for this view, we care about the first item in the path
            // all other items are for children views
            if( this.__path ){
                var viewName = this.__path.shift();
                var view = this.viewForHash(viewName);

                // does the given path match a view?
                if( view ){
                    view.View.__path = this.__path; // tell the child view we are about to load its path
                    delete this.__path; // remove path reference so we dont use it again on next load
                    indx = this.views.indexOf(view);
                }
            }

            // if still no index found, set it
            if( typeof indx == 'undefined' )
                indx = this._activeView();
                
        }else if( _.isString(indx) ){
            var view = this.viewForHash(indx);
            if( view ){
                indx = this.views.indexOf(view);
            }
        }

        var oldView = this.views[this._activeView()] || null;
        var newView = this.views[indx] || this.views[this._firstAvailableView()];

        // defermine if the view should be displayed
        if( newView.displayIf && !Util.displayIf.call(this, newView.displayIf) ){
            if( indx != 0 ) // attempt to load the first view then
                this.loadView(0);
            return;
        }

        this._activeView(indx); // update active view

        // patch for multiple tabs error
        this.views.forEach(function(v){
            if(v == newView){
                return; // no need to hide the view we are about to show.
            }
            v.$menu && v.$menu.removeClass('active');

            if( v.View instanceof MenuControllerView )
                v.View && v.View._hide()
            else
                v.View.$el.removeClass('show');
        });

        if( oldView ){
            oldView.$menu && oldView.$menu.removeClass('active');

            if( oldView.View instanceof MenuControllerView )
                oldView.View && oldView.View._hide()
            else
                oldView.View.$el.removeClass('show');
        }

        newView.$menu && newView.$menu.addClass('active');

        if( newView.View instanceof MenuControllerView )
            newView.View && newView.View._show();
        else
            newView.View && newView.View.render().$el.addClass('show')
    },

    _onMenuClick: function(e){
        e.stopPropagation()
        this.menuSounds&&Sounds.play('tap', 0.25)
        this.loadView(e.currentTarget.dataset.indx)
    },

    _activeView: function(indx){

        var key = 'MenuController:'+(this.className || this.__className)+':ActiveView';

        // get active view
        if( typeof indx == 'undefined' ){
            
            var indx = _.store(key)
            
            // no stored active view
            if( indx == undefined )
                return this._firstAvailableView();
            
            // make sure the user is allowed to see the saved view
            var view = this.views[indx];
            if( view && (!view.permission || Util.permission(view.permission)) )
                return indx
            else
                return this._firstAvailableView();

        // set active view
        }else{
            _.store(key, indx)
        }
    },
    
    // gets index of first available view based on permissions
    _firstAvailableView: function(){
        var defaultIndx = null;
        this.views.forEach(function(d, indx){
            if( defaultIndx == null && (!d.permission || Util.permission(d.permission)) && (d.label || d.icon) )
                defaultIndx = indx;
        })
        return defaultIndx;
    }

})
