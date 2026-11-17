/** Burn the litres and the matching amount onto the pump photo the driver just took. */
export function stampPumpPhoto(dataUrl: string, liters: number, amountRwf: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const barH = Math.max(72, Math.round(img.height * 0.16));
      ctx.fillStyle = 'rgba(11, 22, 31, 0.88)';
      ctx.fillRect(0, img.height - barH, img.width, barH);
      const size = Math.max(18, Math.round(barH * 0.34));
      ctx.font = `700 ${size}px "DM Sans", sans-serif`;
      ctx.textBaseline = 'middle';
      const y = img.height - barH / 2;
      const pad = Math.round(img.width * 0.04);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`${liters} L`, pad, y);
      ctx.fillStyle = '#6ee7b7';
      ctx.textAlign = 'right';
      ctx.fillText(`${amountRwf.toLocaleString('en-RW')} RWF`, img.width - pad, y);
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => reject(new Error('Could not read the pump photo'));
    img.src = dataUrl;
  });
}
