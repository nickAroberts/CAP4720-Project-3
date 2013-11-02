"use strict";
function parseJSON(jsonFile)
{
	var	xhttp = new XMLHttpRequest();
	xhttp.open("GET", jsonFile, false);
	xhttp.overrideMimeType("application/json");
	xhttp.send(null);	
	var Doc = xhttp.responseText;
	return JSON.parse(Doc);
}
function JsonRenderable(gl,program,modelPath,modelfilename){
	var model = parseJSON(modelPath+modelfilename);
	var diffuseTexObjs = loadDiffuseTextures();	
	var meshDrawables = loadMeshes(gl.TRIANGLES);
	var nodeTransformations = computeNodeTrasformations();
	this.draw = function (mMatrix)
	{
		var mM,nM;
		var i,j,nMeshes,node;
		var nNodes = model.nodes.length;
		for (var i= 0; i<nNodes; i++){
			mM = (mMatrix)?(new Matrix4(mMatrix).multiply(nodeTransformations.modelT[i])):nodeTransformations.modelT[i];
			if (mMatrix){
				nM = new Matrix4(mMatrix).multiply(nodeTransformations.normalT[i]);
				nM.elements[12]=0;nM.elements[13]=0;nM.elements[14]=0;
			}
			else nM = nodeTransformations.normalT[i];
			gl.uniformMatrix4fv(program.uniformLocations["modelT"], false,mM.elements);
			gl.uniformMatrix4fv(program.uniformLocations["normalT"], false,nM.elements);
			node = model.nodes[i];
			nMeshes = node.meshIndices.length;
			for (var j=0; j<nMeshes;j++){
				var meshIndex=node.meshIndices[j];	
				var materialIndex=model.meshes[meshIndex].materialIndex;
				
				var r = model.materials[materialIndex].diffuseReflectance;
				gl.uniform3f(program.uniformLocations["diffuseCoeff"],r[0],r[1],r[2]);
				if (diffuseTexObjs[materialIndex]&&diffuseTexObjs[materialIndex].complete){
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_2D,diffuseTexObjs[materialIndex]);
					gl.uniform1i(program.uniformLocations["diffuseTex"],0);
					gl.uniform1i(program.uniformLocations["texturingEnabled"],1);
				}
				else gl.uniform1i(program.uniformLocations["texturingEnabled"],0);
				meshDrawables[meshIndex].draw();
			}
		}
	}
	function computeNodeTrasformations()
	{
		var modelTransformations=[], normalTransformations=[];
		var nNodes;
		var nNodes = model.nodes.length;
		for (var i= 0; i<nNodes; i++){
				var m = new Matrix4();
				m.elements=new Float32Array(model.nodes[i].modelMatrix);
				modelTransformations[i] = m;
				// Compute normal transformation matrix
				normalTransformations[i]=modelMatrixToNormalMatrix(m);
		}
		return {modelT: modelTransformations, normalT: normalTransformations};
	}
	function loadMeshes(drawMode){
		// Create drawable for every mesh
		var drawables=[];
		var nMeshes = model.meshes.length;
		var attribData = [];
		var nElements = [];
		var attribLocations=[];
		var index,i;
		for (index=0; index<nMeshes;index++){
			var mesh = model.meshes[index];
			var attribName;
			i = 0;
			for (attribName in program.attribLocations){
				switch(attribName){
					case 'position': attribData[i] = mesh.vertexPositions; nElements[i]=3; break;
					case 'normal'  : attribData[i] = mesh.vertexNormals; nElements[i]=3; break;
					case 'texCoord': attribData[i] = (mesh.vertexTexCoordinates)?mesh.vertexTexCoordinates[0]:undefined;  nElements[i]=2; break;
					default: {attribData[i] = undefined; nElements[i]= 1;}
				}
				attribLocations[i] = program.attribLocations[attribName];
				i++;
			}
			var nVertices = mesh.vertexPositions.length/3;
			drawables[index] = new Drawable(
				attribLocations,attribData,nElements,nVertices,mesh.indices, drawMode
			);
		}
		return drawables;
	}


	function loadDiffuseTextures()
	{
		function setTexture(gl,textureFileName)
		{
			var tex = gl.createTexture();
			tex.width = 0; tex.height = 0;
			var img = new Image();
			//console.log("From Loader: "+textureFileName);
			//imagecount++;
			img.onload =  //function() { imagecount--; console.log(textureFileName+" loaded");createImageBuffer(img, tex, gl.TEXTURE_2D); }; 

			function(){
				function isPowerOfTwo(x) {
					return (x & (x - 1)) == 0;
				}
				function nextHighestPowerOfTwo(x) {
					--x;
					for (var i = 1; i < 32; i <<= 1) {
						x = x | x >> i;
					}
					return x + 1;
				}
				var nPOT = false; // nPOT: notPowerOfTwo
				//console.log(textureFileName+" loaded : "+img.width+"x"+img.height);
				tex.complete = img.complete;
				//gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, tex);
				//if (!isPowerOfTwo(img.width) || !isPowerOfTwo(img.height)) nPOT = true;
				
				if (!isPowerOfTwo(img.width) || !isPowerOfTwo(img.height)) {
					// Scale up the texture to the next highest power of two dimensions.
					var canvas = document.createElement("canvas");
					canvas.width = nextHighestPowerOfTwo(img.width);
					canvas.height = nextHighestPowerOfTwo(img.height);
					var ctx = canvas.getContext("2d");
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
					img = canvas;
					//console.log(" Scale to POT : "+img.width+"x"+img.height);
				}
				
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
				//void texImage2D(enum target, int level, enum internalformat, enum format, enum type, Object object);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, (nPOT)?gl.CLAMP_TO_EDGE:gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, (nPOT)?gl.CLAMP_TO_EDGE:gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, ((nPOT)?gl.LINEAR:gl.LINEAR_MIPMAP_LINEAR));
				if (!nPOT)gl.generateMipmap(gl.TEXTURE_2D);
				gl.bindTexture(gl.TEXTURE_2D, null);
				tex.width = img.width;
				tex.height = img.height;
				//imagecount--; //console.log("From Loader: "+imagecount);
			};

			img.src = textureFileName;
			return tex;
		}
		var imageDictionary={};
		var texObjs=[];
		for (var i=0; i<model.materials.length;i++){	
			if (model.materials[i].diffuseTexture){
				var filename=model.materials[i].diffuseTexture[0];//.replace(".tga",".jpg");
				if (filename){
					//console.log(filename);
					if (imageDictionary[filename]===undefined){
					  imageDictionary[filename] = setTexture(gl,modelPath+filename);
					}
					texObjs[i] = imageDictionary[filename];
				}
				else texObjs[i] = undefined;
			}
		}
		return texObjs;
	}
	
	
	function Drawable(attribLocations, vArrays, nElements, nVertices, indexArray, drawMode){
		// Create a buffer object
		var vertexBuffers=[];
		var nAttributes = attribLocations.length;
		for (var i=0; i<nAttributes; i++){
			if (vArrays[i]&&(vArrays[i].length==nElements[i]*nVertices)){
				vertexBuffers[i] = gl.createBuffer();
				if (!vertexBuffers[i]) {
					console.log('Failed to create the buffer object');
					return null;
				}
				// Bind the buffer object to an ARRAY_BUFFER target
				gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[i]);
				// Write date into the buffer object
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vArrays[i]), gl.STATIC_DRAW);
			}
			else{
				console.log('No data');
				vertexBuffers[i]=null;
			}
		}
		//console.log(nElements);
		var indexBuffer=null;
		if (indexArray){
			indexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW);
		}
		this.delete = function(){
			if (indexBuffer) gl.deleteBuffer(indexBuffer);
			for (var i=0; i<nAttributes; i++)
			if (vertexBuffers[i])gl.deleteBuffer(vertexBuffers[i]);
		}
		this.draw = function (){
			for (var i=0; i<nAttributes; i++){
				if (vertexBuffers[i]){
					gl.enableVertexAttribArray(attribLocations[i]);
					// Bind the buffer object to target
					gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[i]);
					// Assign the buffer object to a_Position variable
					gl.vertexAttribPointer(attribLocations[i], nElements[i], gl.FLOAT, false, 0, 0);
				}
				else{
					gl.disableVertexAttribArray(attribLocations[i]); 
					if (nElements[i]==3) gl.vertexAttrib3f(attribLocations[i],0,0,1);
					else if (nElements[i]==2) gl.vertexAttrib2f(attribLocations[i],0,0);
					else alert("attribute element size different from 2 and 3");
				}
			}
			if (indexBuffer){
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
				gl.drawElements(drawMode, indexArray.length, gl.UNSIGNED_SHORT, 0);
			}
			else{
				gl.drawArrays(drawMode, 0, nVertices);
			}
		}
	}
	
	this.delete = function()
	{
		var i;
		for (i= 0; i<meshDrawables.length; i++) meshDrawables[i].delete();
		for (i= 0; i<diffuseTexObjs.length; i++) if (diffuseTexObjs[i])gl.deleteTexture(diffuseTexObjs[i]);
	}
	function modelMatrixToNormalMatrix(mat)
	{ 
		var a00 = mat.elements[0], a01 = mat.elements[1], a02 = mat.elements[2],
			a10 = mat.elements[4], a11 = mat.elements[5], a12 = mat.elements[6],
			a20 = mat.elements[8], a21 = mat.elements[9], a22 = mat.elements[10],
			b01 = a22 * a11 - a12 * a21,
			b11 = -a22 * a10 + a12 * a20,
			b21 = a21 * a10 - a11 * a20,
			d = a00 * b01 + a01 * b11 + a02 * b21,
			id;

		if (!d) { return null; }
		id = 1 / d;

		var dest = new Matrix4();

		dest.elements[0] = b01 * id;
		dest.elements[4] = (-a22 * a01 + a02 * a21) * id;
		dest.elements[8] = (a12 * a01 - a02 * a11) * id;
		dest.elements[1] = b11 * id;
		dest.elements[5] = (a22 * a00 - a02 * a20) * id;
		dest.elements[9] = (-a12 * a00 + a02 * a10) * id;
		dest.elements[2] = b21 * id;
		dest.elements[6] = (-a21 * a00 + a01 * a20) * id;
		dest.elements[10] = (a11 * a00 - a01 * a10) * id;

		return dest;
	}
	this.getBounds=function() // Computes Model bounding box
	{		
		var xmin, xmax, ymin, ymax, zmin, zmax;
		var firstvertex = true;
		var nNodes = (model.nodes)?model.nodes.length:1;
		for (var k=0; k<nNodes; k++){
			var m = new Matrix4();
			if (model.nodes)m.elements=new Float32Array(model.nodes[k].modelMatrix);
			//console.log(model.nodes[k].modelMatrix);
			var nMeshes = (model.nodes)?model.nodes[k].meshIndices.length:model.meshes.length;
			for (var n = 0; n < nMeshes; n++){
				var index = (model.nodes)?model.nodes[k].meshIndices[n]:n;
				var mesh = model.meshes[index];
				for(var i=0;i<mesh.vertexPositions.length; i+=3){
					var vertex = m.multiplyVector4(new Vector4([mesh.vertexPositions[i],mesh.vertexPositions[i+1],mesh.vertexPositions[i+2],1])).elements;
					//if (i==0){
					//	console.log([mesh.vertexPositions[i],mesh.vertexPositions[i+1],mesh.vertexPositions[i+2]]);
					//	console.log([vertex[0], vertex[1], vertex[2]]);
					//}
					if (firstvertex){
						xmin = xmax = vertex[0];
						ymin = ymax = vertex[1];
						zmin = zmax = vertex[2];
						firstvertex = false;
					}
					else{
						if (vertex[0] < xmin) xmin = vertex[0];
						else if (vertex[0] > xmax) xmax = vertex[0];
						if (vertex[1] < ymin) ymin = vertex[1];
						else if (vertex[1] > ymax) ymax = vertex[1];
						if (vertex[2] < zmin) zmin = vertex[2];
						else if (vertex[2] > zmax) zmax = vertex[2];
					}
				}
			}
		}
		var dim= {};
		dim.min = [xmin,ymin,zmin];
		dim.max = [xmax,ymax,zmax];
		//console.log(dim);
		return dim;
	}
}
