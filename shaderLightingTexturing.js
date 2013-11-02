"use strict";
function createShaderProgram(gl)
{
	var VSHADER_SOURCE =
	  'attribute vec3 position;\n' +
	  'attribute vec3 normal;\n' +
	  'attribute vec2 texCoord;\n' +
	  'uniform mat4 projT,viewT,modelT,normalT;\n'+
	  'varying vec2 tCoord;\n'+
	  'varying vec3 fragPosition,fragNormal;\n'+
	  'void main() {\n' +
	  '  fragPosition = (viewT*modelT*vec4(position,1.0)).xyz;\n' +
	  '  fragNormal = normalize((viewT*normalT*vec4(normal,0.0)).xyz);\n' +
	  '  tCoord = texCoord;\n'+
	  '  gl_Position = projT*viewT*modelT*vec4(position,1.0);\n' +
	  '}\n';

	// Fragment shader program
	var FSHADER_SOURCE =
	  'precision mediump float;\n'+
	  'uniform vec3 diffuseCoeff;\n'+
	  'uniform sampler2D diffuseTex;\n'+
	  'uniform int texturingEnabled;\n'+
	  'varying vec2 tCoord;\n'+
	  'varying vec3 fragPosition,fragNormal;\n'+
	  'void main() {\n' +
	  '	 float costheta = max(dot(normalize(-fragPosition),normalize(fragNormal)),0.0);\n'+
	  '  vec3 texColor = (texturingEnabled==0)?vec3(1.0):texture2D(diffuseTex,tCoord).rgb;\n'+
	  '  gl_FragColor = vec4(texColor*diffuseCoeff*costheta,1.0);\n' +
	  '}\n';
	var program = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
	if (!program) {
		console.log('Failed to create program');
		return false;
	}
	var attribNames = ['position','normal','texCoord'];
	program.attribLocations = {};
	var i;
	for (i=0; i<attribNames.length;i++){
		program.attribLocations[attribNames[i]]=gl.getAttribLocation(program, attribNames[i]);
	}
	var uniformNames = ['modelT', 'viewT', 'projT', 'normalT', 'diffuseCoeff', 'diffuseTex', 'texturingEnabled'];
	program.uniformLocations = {};
	
	for (i=0; i<uniformNames.length;i++){
		program.uniformLocations[uniformNames[i]]=gl.getUniformLocation(program, uniformNames[i]);
	}
	return program;
}
