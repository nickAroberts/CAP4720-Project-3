function Camera(gl,d,modelUp) // Compute a camera from model's bounding box dimensions
{
	var center = [(d.min[0]+d.max[0])/2,(d.min[1]+d.max[1])/2,(d.min[2]+d.max[2])/2];
	var diagonal = Math.sqrt(Math.pow((d.max[0]-d.min[0]),2)+Math.pow((d.max[1]-d.min[1]),2)+Math.pow((d.max[2]-d.min[2]),2));
	//console.log(center+" "+diagonal);
	
	var name = "auto";
	var at = [center[0], center[1], center[2]];;
	var eye = [at[0], at[1], at[2]+diagonal*1.5];
	var up = [modelUp[0],modelUp[1],modelUp[2]];
	var near = diagonal*0.1;
	var far = diagonal*3;
	var FOV = 32;
	this.dolly=function(delta){
		var m = this.getViewMatrix();
		var W = [m.elements[2],m.elements[6],m.elements[10]];
		var deltaEye = [delta*diagonal*W[0],delta*diagonal*W[1],-delta*diagonal*W[2]];
		//console.log(deltaEye);
		eye[0] += deltaEye[0];eye[1] += deltaEye[1];eye[2] += deltaEye[2];
		//at[0] += deltaEye[0];at[1] += deltaEye[1];at[2] += deltaEye[2];
		//console.log(eye);
	}
	this.getRotatedCameraPosition= function(angle){
		var m = new Matrix4().setTranslate(center[0],center[1],center[2]).rotate(angle,up[0],up[1],up[2]).translate(-center[0],-center[1],-center[2]);
		var e = m.multiplyVector4(new Vector4([eye[0],eye[1],eye[2],1])).elements;
		return [e[0],e[1],e[2]];
	};
	this.getViewMatrix=function(e){
		if (e==undefined) e = eye;
		return new Matrix4().setLookAt(e[0],e[1],e[2],at[0],at[1],at[2],up[0],up[1],up[2]);
	}
	this.getRotatedViewMatrix=function(angle){
		return this.getViewMatrix(this.getRotatedCameraPosition(angle));
	}
	this.getProjMatrix=function(){
		return new Matrix4().setPerspective(FOV, gl.canvas.width / gl.canvas.height, near , far);
	};
}
