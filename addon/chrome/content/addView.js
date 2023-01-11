"use strict";

var AddView = new function () {
	var _io;
	var _window;
	this.init = function (_window) {
		this._io = window.arguments[0]
		this._window = _window
		this._window.document.querySelector("#view-name").setAttribute("value", this._io.name)
		this._window.document.querySelector("#view-position").setAttribute("value", this._io.position)
		this._window.document.querySelector("#view-content").setAttribute("value", this._io.content)
		console.log("init", this._io)
	};

	this.onDialogAccept = function () {
		this._io.name = this._window.document.querySelector("#view-name").value
		this._io.position = this._window.document.querySelector("#view-position").value
		this._io.content = this._window.document.querySelector("#view-content").value
		console.log("onDialogAccept", this._io)
	};

	this.onDialogCancel = function () {
	};
};