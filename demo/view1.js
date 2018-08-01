
const Backbone = require('backbone')
const SheetView = require('../src/SheetView')
const MenuController = require('../src/MenuController')
const MenuControllerView = require('../src/MenuControllerView')

let About = MenuControllerView.extend({
	
	template: `<h1>Backbone.js Groundwork</h1>
	<p>This is all about what Groundwork does</p>
	<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>`,
	
	actionsLayout: 'bottom',
	actions: [{
		label: 'Action ',
		className: 'red',
		onClick: 'action1'
	},{
		label: 'Action Menu',
		className: 'blue',
		dropdown: {
			view: [{
				label: 'Option 1'
			},{
				label: 'Option 2'
			}],
			onClick(item){
				alert('You selected '+item.label)
			}
		}
	},{
		label: 'Progress Bar',
		onClick: 'showProgress'
	}],
	
	action1(){
		alert('do something cool')
	},
	
	showProgress(){
		let i = 0
		clearInterval(this.progressInterval)
		this.progressInterval = setInterval(()=>{
			this.parent('view-1').progress(100, i++, true)
			if( i > 100 ) clearInterval(this.progressInterval)
		}, 50)
	}
})


let MenuView = MenuController.extend({
	
	views: [{
        label: 'About',
        icon: 'info-circled',
        view: About,
    },{
		label: 'Install',
		icon: 'download',
		view: Backbone.View,
	}],
	
})


module.exports = SheetView.extend({
	
	title: 'View 1',
	
	toolbarTitleMenu(){
		return {
			view: [{
				label: 'Testing'
			}],
			align: 'bottom',
			w: 140
		}
	},
	
	views: {
		'menu': MenuView
	},
	
	btns: [{
		label: 'View 3',
		className: 'f-right blue',
		onClick: 'openView3'
	},{
		label: 'View 2',
		className: 'f-right blue',
		onClick: 'openView2'
	}],
	
	openView2(){
		this.parent('root.view-2').open()
	},
	
	openView3(){
		this.parent('root.view-3').open()
	}
})