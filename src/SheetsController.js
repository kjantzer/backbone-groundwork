/* ==============================
    Sheets Controller

    takes care of showing and hiding the sheets div (since it sits on top of the main view, it
    must be hidden to allow for main view to function)

    when a SheetView is opened, the controller adds it to the DOM and stores reference;
    the controller always knows how many sheets are open

    initialized by App.js
    reference: app.sheets
*/

let SheetView = require('./SheetView')

module.exports = Backbone.View.extend({

    id: "sheets",

    SPEED: 200,		// keep insync with CSS transition
    SPACING: 20,	// used determine sheet to close via "closeUnder"
    
    initialize(){
        
        this._defaultTitle = document.title
        
        if( SheetView.prototype.controller )
            return console.warn('A SheetsController already exists')
        
        // add reference to controller on the SheetView class
        SheetView.prototype.controller = this;
    },

    sheets: [], // array of open sheets

    // open a sheet view
    open: function(sheet){

        // FIXME
        app.stopSearching && app.stopSearching()

        // if this is the first sheet to open, show the sheet controller el
        if( this.sheets.length == 0 )
            this.show();
        else{
            var lastSheet = _.find(_.clone(this.sheets).reverse(), function(v){ return !v.isSplitView })

            if( lastSheet.isFullscreen && !sheet.isFullscreen )
                sheet.toggleFullscreen()

            else if( !lastSheet.isFullscreen && sheet.isFullscreen )
                sheet.toggleFullscreen()
        }

        // if view already open and its NOT the top most view, move it to the top of all open sheets
        if( sheet.isOpen && sheet.index < this.sheets.length-1 ){

            // move saved view to end of stored open views
            this.sheets = this.sheets.concat(this.sheets.splice(sheet.index,1))
            this.el.appendChild(sheet.$sheet[0]);

            // update indexes of each view.
            this.sheets.forEach(function(_sheet, indx){
                _sheet.index = indx;
            })
            
            sheet._renderView()

        // view is not open yet
        } else if( !sheet.isOpen) {

            // store reference to view and tell sheet what index it is
            sheet.index = this.sheets.push(sheet) - 1;

            // render and add sheet to dom
            this.$el.append( sheet._renderView().$sheet );
        }else if( sheet.isOpen ){
            sheet._renderView()
        }

        this.setHash();

        // tell sheet to finish opening itself
        _.defer(sheet._open.bind(sheet))
    },

    // close a sheet view
    close: function(sheet){
        this.closeFromIndex( sheet.index );
    },

    closeAll: function(){
        this.closeFromIndex(0);
    },

    closeFromIndex: function(indx){

        var removeSheets = _.rest(this.sheets, indx);

        // remove each panel
        _.each( removeSheets, _.bind(function(_sheet, indx){

            _sheet.index = null; // reset index
            _sheet._close();	 // tell sheet to close itself

        },this));

        // remove references to these sheets
        this.sheets.splice(indx, removeSheets.length)

        this.setHash();

        if( this.sheets.length == 0 ){

            setTimeout(this.hide.bind(this), this.SPEED); // before hiding, allow for css animation to finish

        }

    },

    setHash: function(){

        var hash = this.sheets.length > 0 ? this.sheets[this.sheets.length-1].hashName() : null;

        if( hash ){
            
            var titles = _.map(this.sheets, function(view){
                return view.setTitleOnOpen ? _.stripTags(view.setTitleOnOpen()) : view.title;
            })
            titles.unshift(this._defaultTitle)
            document.title = titles.reverse().join(' | ')
            location.hash = hash;

        // remove hash
        }else{
            history.pushState("", document.title, window.location.pathname + window.location.search);
            if( app )
                document.title = this._defaultTitle;
        }

        if( window.isElectron && window.setWindowTitle )
            window.setWindowTitle()
    },

    show: function(){
        this.$el.addClass('show')
        $('body').addClass('sheet-open')
    },

    hide: function(){
        this.$el.removeClass('show')
        $('body').removeClass('sheet-open')
    },

    toggleFullscreen: function(sheet){

        if( !sheet.isFullscreen )
            _.each(this.sheets, function(v){
                v.fullscreen(false);
            })
    }

})