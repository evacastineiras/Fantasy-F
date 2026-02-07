import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  oldPassword : string = '';
  newPassword : string = '';
  repPassword : string = '';

  constructor(private router: Router, private userService: UserService, private authService: AuthService) { }


  userImagePath = this.userService.getUsuario().profileImage;

 profileImagePreview: string = this.userImagePath 
    ? this.authService.backendUrl + this.userImagePath 
    : "../../../../assets/default-profile.png";
  croppedImageBase64: string | null = null;
  selectedFile!: File;

  showCropper = false;
  showPassPopUp = false;
  showDeletePopUp = false;
  tempImage: string = "";
  posX = 0;
  posY = 0;
  scale = 1;

  private dragging = false;
  private startX = 0;
  private startY = 0;

  activeUserData = { 
    nombre: this.userService.getUsuario().nombre,
    username: this.userService.getUsuario().username,
    email: this.userService.getUsuario().email,
    id: this.userService.getUsuario().id,
    profileImage: this.profileImagePreview
  }
  ngOnInit(): void { }

  goHome() {
    this.router.navigate(['/home']);
  }

  openDeleteModal() {
  this.showDeletePopUp = true;
}

closeDeleteModal() {
  this.showDeletePopUp = false;
}

confirmDelete() {
  const userId = this.activeUserData.id;
  
  this.authService.deleteProfile(userId).subscribe({
    next: (res: any) => {
      console.log("Cuenta eliminada");
      this.showDeletePopUp = false;
      this.userService.logout(); 
      this.router.navigate(['/']); 
    },
    error: (err: any) => {
      console.error("Error al borrar cuenta", err);
      window.alert("No se pudo eliminar la cuenta.");
    }
  });
}

  update() {
    
    const updateData = { 
      ...this.activeUserData, 
      profileImage: this.croppedImageBase64 || this.activeUserData.profileImage
    };

    this.authService.editProfile(updateData).subscribe({
      next: (res:any) => {
        console.log("Datos guardados", res);
        this.userService.logout();
        localStorage.setItem('usuario', JSON.stringify(res.user));
        this.router.navigate(['/profile']);
      },
      error: (error:any) => {
        console.error('Error al editar perfil', error);
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.tempImage = reader.result as string;
        this.showCropper = true;

        this.posX = 0;
        this.posY = 0;
        this.scale = 1;
      };
      reader.readAsDataURL(file);
    }
  }

  
  startDrag(event: MouseEvent) {
    this.dragging = true;
    this.startX = event.clientX - this.posX;
    this.startY = event.clientY - this.posY;

    window.addEventListener("mousemove", this.onDrag);
    window.addEventListener("mouseup", this.stopDrag);
  }

  
  onDrag = (event: MouseEvent) => {
    if (!this.dragging) return;
    this.posX = event.clientX - this.startX;
    this.posY = event.clientY - this.startY;
  }

  stopDrag = () => {
    this.dragging = false;
    window.removeEventListener("mousemove", this.onDrag);
    window.removeEventListener("mouseup", this.stopDrag);
  };

  cancelCrop() {
    this.showCropper = false;
  }

applyCrop() {
    const profileImageElement = document.querySelector('.img-box img') as HTMLImageElement;
    if (!profileImageElement) {
        this.showCropper = false;
        return;
    }

    const finalSize = profileImageElement.clientWidth;
    const cropperSize = 250; 
    const finalScaleFactor = finalSize / cropperSize; 

    const canvas = document.createElement("canvas");
    canvas.width = finalSize;
    canvas.height = finalSize;

    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.src = this.tempImage;

    img.onload = () => {
        ctx.beginPath();
        ctx.arc(finalSize / 2, finalSize / 2, finalSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const imgAspectRatio = img.width / img.height;
        let baseWidthInCropper = cropperSize * imgAspectRatio;
        const baseHeightInCropper = cropperSize; 
        
      
        const zoomedWidth = baseWidthInCropper * this.scale;
        const zoomedHeight = baseHeightInCropper * this.scale;

        const initialOffsetX = (cropperSize - baseWidthInCropper) / 2;
        const autoZoomOffsetX = (zoomedWidth - baseWidthInCropper) / 2;
        const autoZoomOffsetY = (zoomedHeight - baseHeightInCropper) / 2;
        
        
        const drawX = this.posX - autoZoomOffsetX;
        const drawY = this.posY - autoZoomOffsetY;

        ctx.drawImage(
            img,
            drawX * finalScaleFactor,    
            drawY * finalScaleFactor,  
            zoomedWidth * finalScaleFactor,  
            zoomedHeight * finalScaleFactor 
        );

        this.profileImagePreview = canvas.toDataURL();
        this.croppedImageBase64 = this.profileImagePreview;
        this.showCropper = false;
    };
}

changePasswordCross()
{
  
  this.showPassPopUp = !this.showPassPopUp;


}

changePassword()
{
  if(!this.oldPassword || !this.newPassword || !this.repPassword)
  {
    window.alert("Campos incompletos");
  } else{
    if(this.newPassword !== this.repPassword)
    {
      window.alert("Las contraseñas no coinciden");
    } else {
      if(this.newPassword.length < 6 || this.newPassword.length > 30){
        window.alert("La contraseña debe ser mayor a 6 caracteres e inferior a 30");
      }
     else {
        const data = {
          password: this.oldPassword,
          newPassword: this.newPassword,
          id: this.userService.getUsuario().id
        }

        this.authService.changePassword(data).subscribe({
          next: (res:any) => {
        console.log("Contraseña cambiada: ", res);
        this.showPassPopUp = false;
      },
      error: (error:any) => {
        console.error('Error al cambiar contraseña: ', error);
      }
        });
    }
  }
}   
}    
}

