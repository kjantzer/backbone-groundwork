
window.jQuery = window.$ = require('jquery')
window._ = require('underscore')
_.mixin( require('underscore.string').exports() );
window.Backbone = require('backbone')
Backbone.$ = jQuery

require('kjantzer-backbone-subviews')
window.Dropdown = require('backbone-dropdown')
let dropdownPlugins = require('backbone-dropdown/src/jquery-plugin')
for( let key in dropdownPlugins ){
    jQuery.fn[key] = dropdownPlugins[key]
}

_.mixin({
	store(key, val){
		if( val === undefined)
			return localStorage.getItem(key)
		else
			return val === null ? localStorage.removeItem(key) : localStorage.setItem(key, val)
	}
})

window.App = require('../src/App')

window.app = new App.SheetsController()

document.body.append( app.el );

app.render()

let View = require('./view1')

let View2 = App.SheetView.extend({
	title: 'View 2',
	toolbarStyle: 'purewhite',
	w: 900,
	h: 500
})

let View3 = App.SheetView.extend({
	title: 'View 3'
})

app.sv('view-1', View)
app.sv('view-2', View2)
app.sv('view-3', View3)