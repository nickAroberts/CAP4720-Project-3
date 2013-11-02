var newModelFlag = true;
var dollyRequired=0;
var rotateFlag =true;
function toggleRotateFlag(){rotateFlag = !rotateFlag;}

function main(){
	// ... global variables ...
	var gl,model,camera,program;
	var canvas = null;
	var messageField = null;
	function addMessage(message){
		console.log(message);
	}
	canvas = document.getElementById("myCanvas1");
	//addMessage(((canvas)?"Canvas acquired":"Error: Can not acquire canvas"));
	gl = getWebGLContext(canvas,false);//Disable debugging
		
	var angle=0;
	program=createShaderProgram(gl);
	gl.clearColor(0,0,0,1);
	gl.enable(gl.DEPTH_TEST);
	draw();
	return 1;
	function draw(){
		if (newModelFlag)newModel();
		if (dollyRequired){camera.dolly(0.05*dollyRequired);dollyRequired=0;}
		gl.useProgram(program);

		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
		var projMatrix = camera.getProjMatrix();
		gl.uniformMatrix4fv(program.uniformLocations["projT"], false, projMatrix.elements);
		var viewMatrix = camera.getRotatedViewMatrix(angle);
		gl.uniformMatrix4fv(program.uniformLocations["viewT"], false, viewMatrix.elements);

		model.draw();
		if (rotateFlag){angle++; if (angle > 360) angle -= 360;}

		gl.useProgram(null);

		window.requestAnimationFrame(draw);
	}
	function newModel(path)
	{
		function getCurrentModelPath(){
			return document.getElementById("modelList").value;
			//return pathname;
		}
		if (model) model.delete();
		if (!path) path = getCurrentModelPath();
		console.log(path);
		model=new JsonRenderable(gl,program,"./model/"+path+"/models/","model.json");
		if (!model)alert("No model could be read");
		else newModelFlag = false;
		var bounds = model.getBounds();
		camera = new Camera(gl,bounds,[0,1,0]);
	}
}