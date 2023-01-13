"use strict";

var Dialog = new function () {
	var io;
	var document;
	this.init = function () {
		io = window.arguments[0]
		document = window.document

		console.log("init", io)
		
		const dialogNode = document.querySelector("dialog")
		Object.keys(io.attributes).forEach(key => {
			dialogNode.setAttribute(key, io.attributes[key])
			// 特殊属性特殊处理
			if (key == "buttonlabelaccept") {
				dialogNode.getButton("accept").label = io.attributes[key]
			}
		})

		dialogNode.appendChild(io.element)

		this.accept = () => { io.hooks.accept && io.hooks.accept(document) }
		this.cancel = () => { io.hooks.cancel && io.hooks.cancel(document) }
	};
};