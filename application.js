'use strict';

import Header from './widgets/header.js';
import Core from '../app-framework/tools/core.js';
import Dom from '../app-framework/tools/dom.js';
import Templated from '../app-framework/components/templated.js';
import Configuration from '../app-framework/data_structures/configuration/configuration.js';
import Styler from '../app-framework/components/styler.js';
import Popup from '../app-framework/ui/popup.js';
import Loader from '../app-framework/widgets/loader.js';
import Playback from '../app-framework/widgets/playback.js';
import ServerLoader from '../app-framework/widgets/server-loader.js';
import PopupPalette from '../app-framework/widgets/palette/popup-palette.js';
import Settings from '../app-framework/widgets/settings/settings.js';
import PopupLinker from '../app-framework/widgets/linker/popup-linker.js';
import DiagramAuto from '../app-framework/widgets/diagram/auto.js'
import GridAuto from '../app-framework/widgets/grid/auto.js'
import Recorder from '../app-framework/components/recorder.js';
import Zip from '../app-framework/tools/zip.js';

export default Core.Templatable("Application", class Application extends Templated { 

	constructor(node) {		
		super(node);
		
		Dom.AddCss(document.body, "Simple");
	
		this.AddWidget("server-loader", new ServerLoader());
		this.AddWidget("settings", new Settings());
		this.AddWidget("linker", new PopupLinker());
		this.AddWidget("palette", new PopupPalette());
		
		this.Node('btnRedo').On('click', this.OnButtonRedo_Click.bind(this));
		this.Node('btnServer').On('click', this.OnButtonServerLoader_Click.bind(this));
		this.Node('btnSettings').On('click', this.OnButtonSettings_Click.bind(this));
		this.Node('btnDownload').On('click', this.OnButtonDownload_Click.bind(this));
		this.Node('btnLinker').On('click', this.OnButtonLinker_Click.bind(this));
		this.Node('btnPalette').On('click', this.OnButtonPalette_Click.bind(this));
		
		this.Widget('loader').On('ready', this.OnUpload_Ready.bind(this));
		this.Widget('loader').On('error', this.OnWidget_Error.bind(this));
		this.Widget("server-loader").On("filesready", this.OnFiles_Loaded.bind(this));
		this.Widget("server-loader").On("error", this.OnWidget_Error.bind(this));
		
		this.Clear();
		this.ShowView("load");
	}
	
	ShowView(view) {
		this.Elem("btnSettings").disabled = view == "load";
		this.Elem("btnDownload").disabled = view == "load";
		this.Elem("btnLinker").disabled = view != "DEVS";
		this.Elem("btnPalette").disabled = view != "Cell-DEVS";
		
		Dom.SetCss(this.Elem("main"), `view-${view}`);
		
		if (view === "load") return;
		
		else if (view == "DEVS") {			
			this.view = new DiagramAuto(this.Elem("view"), this.simulation, this.configuration.diagram);
		}
		else if (view === "Cell-DEVS") {
			this.view = new GridAuto(this.Elem("view"), this.simulation, this.configuration.grid);
		}
		else {
			this.OnWidget_Error(new Error("The base DEVS viewer does not support simulations of type " + view));
		}
		
		this.view.Resize();
		this.view.Redraw();
	}
	
	Clear() {
		if (this.view) this.view.Destroy();
		
		this.configuration = null;
		this.simulation = null;
		this.view = null;
	}
	
	OnUpload_Ready(ev) {
		this.Clear();
		
		this.configuration = ev.configuration;
		this.simulation = ev.simulation;
		this.files = ev.files;
				
		this.ShowView(ev.simulation.type);
		
		this.Widget("playback").recorder = new Recorder(this.view.widget.canvas);
		this.Widget("playback").Initialize(this.simulation, this.configuration.playback);
		this.Widget('settings').Initialize(this.simulation, this.configuration);	
		this.Widget('linker').Initialize(this.simulation, this.files.diagram);	
		
		if (this.simulation.type != "Cell-DEVS") return;
		
		this.Widget('palette').Initialize(this.simulation, this.configuration);	
	}
	
	OnButtonServerLoader_Click(ev) {
		this.Widget("server-loader").Show();
	}
	
	OnButtonRedo_Click(ev) {	
		this.Clear();			
		this.ShowView("load");
	}
	
	OnButtonSettings_Click(ev) {
		this.Widget("settings").UpdateUI();
		this.Widget("settings").Show();
	}
	
	OnButtonPalette_Click(ev) {
		this.Widget("palette").Show();
	}
	
	OnButtonDownload_Click(ev) {		
		if (this.files.cd_ma && this.files.cd_log) {
			var files = [this.configuration.ToFile()];
			
		}
		
		else {
			var files = [this.files.structure, this.files.messages, this.configuration.ToFile()];
			
			if (this.files.diagram) files.push(this.files.diagram);
		}
			
		Zip.SaveZipStream(this.simulation.name, files);
	}
	
	async OnButtonLinker_Click(ev) {
		await this.Widget("linker").Show(this.simulation, this.files.diagram);
		
		this.files.diagram = this.Widget("linker").svg_file;
	}

	OnFiles_Loaded(ev) {
		this.Widget("server-loader").Hide();
		this.Widget("loader").Load(ev.files);
	}
	
	OnWidget_Error(ev) {
		alert (ev.error);
	}
		
	Template() {
		return	"<main handle='main'>" +
					"<div handle='header' class='application-header' widget='Widget.Header'></div>" +
				    "<div class='centered-row'>" + 
						"<div class='button-column'>" + 
						   "<button handle='btnRedo' title='nls(Application_Redo)' class='fas fa-redo'></button>" +
						   "<button handle='btnServer' title='nls(Application_Server)' class='fas fa-cloud-download-alt'></button>" +
						"</div>" +
						"<div class='body'>" + 
						   "<div handle='dropzone' class='dropzone-container'>" + 
							   "<div handle='loader' widget='Widget.Loader'></div>" +
						   "</div>" +
						   "<div handle='views' class='simulation-container'>" +
							   "<div handle='view' class='simulation'></div>" +
							   "<div handle='playback' widget='Widget.Playback'></div>" +
						   "</div>" +
						"</div>" +
						"<div class='button-column'>" + 
						   "<button handle='btnSettings' title='nls(Application_Settings)' class='fas fa-tools' disabled></button>" +
						   "<button handle='btnPalette' title='nls(Application_Palette)' class='fas fa-palette' disabled></button>" +
						   "<button handle='btnLinker' title='nls(Application_Linker)' class='fas fa-link' disabled></button>" +
						   "<button handle='btnDownload' title='nls(Application_Download)' class='fas fa-download' disabled></button>" +
						"</div>" +
					"</div>" +
				"</main>";
	}
	
	static Nls() {
		return {
			"Application_Redo" : {
				"en":"Load new simulation results"
			},
			"Application_Server" : {
				"en":"Load simulation results from server"
			},
			"Application_Settings" : {
				"en" : "Modify simulation playback settings"
			},
			"Application_Download" : {
				"en" : "Download normalized simulation files"
			},
			"Application_Palette" : {
				"en" : "Modify grid palette"
			},
			"Application_Linker" : {
				"en" : "Review links between diagram and simulation structure"
			}
		}
		
	}
});