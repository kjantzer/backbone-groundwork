/*
    Utility Methods used across Groundwork components
*/

const Sounds = require('./Sounds')

let Util = {

    // override this to fit your application
    permission: function(permission){
        return User.can(permission);
    },

    displayIf: function(displayIf){

        switch(displayIf){

            case 'not-new':
            case '!new':
                if( !this.model || this.model.isNew() )
                    return false;
                    break;

            case 'new':
                if( this.model && !this.model.isNew() )
                    return false;
                    break;

            default:
                if( typeof displayIf == 'function' && !displayIf.call(this) )
                    return false;
                    break;
        }

        return true;
    },

    // used by SheetView (eventually) and MenuControllerView
    addBtn: function(btnOpts, $appendTo){

        btnOpts = (_.isString(btnOpts) && this._btnPresets && this._btnPresets[btnOpts]) || btnOpts;

        let btn = _.extend({}, {
            className: '',
            label: '',
            title: '',
            icon: '',
            displayIf: null, // function or predefined string
            permission: null,
            disabled: false,
            toggleEvent: null, // will listen for this event and toggle enabled/disabled
            toggleIf: null, // function($btn, enable){return true;}
            sound: false
        }, btnOpts)

        // defermine if the button should be displayed
        if( btn.displayIf && !Util.displayIf.call(this, btn.displayIf) )
            return;

        // dont add button if user does not have permission
        if( btn.permission && !Util.permission(btn.permission) )
            return;

        if( btn.label ) btn.label = '<span>'+(_.isFunction(btn.label)?btn.label.call(this, btn):btn.label)+'</span>'
        
        var $btn = $(`<a class="btn ${btn.className}" title="${btn.title}">${btn.label}</a>`)

        $btn.appendTo($appendTo);

        if( btn.icon )
            $btn.addClass('icon-'+btn.icon)

        if( btn.disabled )
            $btn.addClass('disabled')
        else if( btn.toggleIf )
            btn.toggleIf.call(this, $btn) ? $btn.addClass('disabled') : null;

        if( btn.toggleEvent ){
            this.listenTo(this, btn.toggleEvent, function(enable){
                return (btn.toggleIf ? btn.toggleIf.call(this, $btn, enable): enable) ? $btn.removeClass('disabled') : $btn.addClass('disabled');
            })
        }

        if( btn.onClick ){

            var onClickFn = null;

            if( typeof btn.onClick == 'function' )
                onClickFn = btn.onClick.bind(this);

            // look for method matching string name
            else if( typeof btn.onClick == 'string' && this[btn.onClick] )
                onClickFn = this[btn.onClick].bind(this);

            // look for method on root view matching string name
            else if( typeof btn.onClick == 'string' && this.view && this.view[btn.onClick] )
                onClickFn = this.view[btn.onClick].bind(this.view);

            if( onClickFn )
                $btn.click(function(e){

                    if( $btn.hasClass('disabled') ) return;

                    btn.sound&&Sounds.play(btn.sound===true?'appear':btn.sound, 0.25)
                    onClickFn(e, $btn, btnOpts)
                })

        }else if( btn.dropdown ){
            if( _.isFunction(btn.dropdown) ) btn.dropdown = btn.dropdown.call(this);
            $btn.dropdown(btn.dropdown.values||btn.dropdown.view, _.extend({
                context: btn.dropdown.context || this
            }, btn.dropdown));
        }
    },

    isFullscreen: function(el){
        
        var fsEl = document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement ||
            document.mozFullScreenElement
        
        return el == undefined ? !!fsEl : fsEl == el
    },

    // https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
    toggleFullscreen: function(el, callback){
        
        var body = document.body
        
        // fullscreen API not supported, use fallback if given
        if( !body.requestFullscreen &&
            !body.webkitRequestFullScreen &&
            !body.msRequestFullscreen &&
            !body.mozRequestFullScreen
        ){
            callback && callback({error:new Error('Fullscreen not supported')})
            return
        }
        
        // if NOT already in full screen, go full screen now
        if( !document.fullscreenElement &&
            !document.webkitFullscreenElement &&
            !document.msFullscreenElement &&
            !document.mozFullScreenElement
        ){    
            if (el.requestFullscreen)
                el.requestFullscreen();
            else if (el.msRequestFullscreen)
                el.msRequestFullscreen();
            else if (el.mozRequestFullScreen)
                el.mozRequestFullScreen();
            else if (el.webkitRequestFullscreen)
                el.webkitRequestFullscreen();
                
        }else{
            if (document.exitFullscreen)
                document.exitFullscreen();
            else if (document.msExitFullscreen)
                document.msExitFullscreen();
            else if (document.mozCancelFullScreen)
                document.mozCancelFullScreen();
            else if (document.webkitExitFullscreen)
                document.webkitExitFullscreen();
        }
        
        var changeEvent = 'fullscreenchange'
        if( document.onmozfullscreenchange !== undefined ) changeEvent = 'mozfullscreenchange'
        if( document.onwebkitfullscreenchange !== undefined ) changeEvent = 'webkitfullscreenchange'
        
        var fullscreenChange = function(){
            var _el = document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.msFullscreenElement ||
                document.mozFullScreenElement;
            
            if( !_el )
                document.removeEventListener(changeEvent, fullscreenChange)
                
            callback && callback({event: 'fullscreenchange', el:_el})
        }
        
        document.addEventListener(changeEvent, fullscreenChange)
        
    }

}

module.exports = Util