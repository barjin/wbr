export class ScreenControls {
  static draw(image: string) {
    const canvas = document.getElementById('screen') as any;
    if (canvas) {
      const ctx = canvas.getContext('2d');

      const img = new Image();

      img.src = `data:image/jpg;base64,${image}`;
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        ctx?.drawImage(img, 0, 0);
      };
    }
  }
}

export default function Screen() {
  return <canvas id='screen' width="1280" height="720" style={{ backgroundColor: 'lightgrey' }}/>;
}
