class Editor extends BaseApp{
  	constructor(){
		super("edit", "Editor");
      
      	this.openFiles = [];
      	this.focussedEditor = undefined;
      	
		include([
		    "/lib/xterm.js/dist/xterm.css",
		    "/apps/edit/alarms.css",
          	"/apps/edit/window.js",
          	"/apps/edit/editorwindow.js",
          	"/apps/edit/filebrowser.js",
          	"/apps/edit/fileitem.js",
          	"/apps/edit/filedropdown.js",
          	"/apps/edit/newfilemodal.js",
          	"/apps/edit/newdirmodal.js",
          	"/apps/edit/deletemodal.js",
          	"/apps/edit/reconnectmodal.js",
          	"/lib/xterm.js/dist/xterm.js",
          	"/apps/edit/terminal.js"
        ], null, true);
    }
  
  	init(){
      	super.init();
      	this.activeItem = null;

		//this.alarmWindow = new EditorWindow("editor");
      
      	this.inspector = new FileBrowser(this);

      	let frameSet = new FrameSet( false, this.view,  this.view);	
      
        let bottomFrame = new Frame( frameSet, 0.1 );
      	bottomFrame.setContent ( new TabGroup( this.view, this.inspector.tab ) );
      	frameSet.addFrame( bottomFrame, 0.3 );
      
        let mainFrame = new Frame( frameSet );
      	//this.mainFrame = mainFrame;
      	mainFrame.setContent ( new TabGroup( this.view, null ) );
      	frameSet.addFrame( mainFrame, 0.8 );
      
        this.terminals = [];
        this.openTerminals();
      
      	document.addEventListener("keydown", (e) => {
      		if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
                e.preventDefault();
                this.save();
            }
            
            if (e.keyCode == 192 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
                e.preventDefault();
                e.stopPropagation();
                this.openTerminal();
            }
            
          	return false;
      	});
      	
      	ace.config.set("basePath", "/lib/ace");
      	ace.require("ace/edit_session").EditSession.prototype.$startWorker = function(){}
      	
      	app.socketManager.socket.on("reconnect", ()=>{
      	    this.attachTerminals();
      	})
    }
    
    attachTerminals(){
        console.log("Reattaching to disconnected terminals")
        this.terminals.forEach((terminal) => {
            terminal.attach();
        });       
    }
    
    openTerminals(){
        app.reqManager.get("/api/edit/openterminals", (res) => {
            if(res.status === 200){
                console.log(res);
                this.ids = JSON.parse(res.response).found;
                if(this.ids.length > 0){
                    new ReconnectModal(this, this.ids);
                }
            }
        });        
    }
    
    close(editor){
        let i = 0;
        while (i < this.openFiles.length){
            if(editor == this.openFiles[i]){
                this.openFiles.splice(i,1);
                this.focussedEditor = null;
                i = this.openFiles.length;
            }
            i++;
        }
    }
	
  	open(file){
        let editorWindow = new EditorWindow(file, this);
        this.openFiles.push(editorWindow);
        this.view.frames[this.view.frames.length - 1].content.addTab(editorWindow.tab);
        this.setFocus(editorWindow);
    }
    
    openTerminal(id){
        let terminalWindow = new TerminalWindow(this, id);
        this.terminals.push(terminalWindow);
        this.view.frames[this.view.frames.length - 1].content.addTab(terminalWindow.tab);
        this.setFocus(terminalWindow);
    }
    
    getOpen(file){
   	    let editorWindow = null;
  	    let i = 0;
  	    while (i < this.openFiles.length ){
  	        if(this.openFiles[i].file.name == file.name && this.openFiles[i].file.dir == file.dir){
  	            editorWindow = this.openFiles[i];
  	            i = this.openFiles.length;
  	        }
  	        i++;
  	    }
  	    return editorWindow;
    }
  
  	save(){
        if(this.focussedEditor !== null && this.isActive){
          	let data = this.focussedEditor.getValue();
          	let file = this.focussedEditor.file;
          	let saving = this.focussedEditor;
          	app.reqManager.post("api/save/"+file.name+"?cd="+file.dir, data, (res) => {
            	if(res.status === 200){
            	    saving.markClean();
            	}
            });
        }
    }
  
  	setFocus(editor){
    	if(editor != this.focussedEditor){
          	if(this.focussedEditor !== undefined && this.focussedEditor !== null){
          	    if(this.focussedEditor.unFocus !== undefined){
          	        this.focussedEditor.unFocus();
          	    }
            }
          	
        	this.focussedEditor = editor;
        }
    }
}

new Editor();