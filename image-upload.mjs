export const IMAGE_MAX_EDGE=1600,IMAGE_MAX_BYTES=2*1024*1024;
export function imageDimensions(width,height,maxEdge=IMAGE_MAX_EDGE){const scale=Math.min(1,maxEdge/Math.max(width,height));return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};}
export async function compressImage(file, {maxEdge=IMAGE_MAX_EDGE, maxBytes=IMAGE_MAX_BYTES} = {}) {
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 25*1024*1024) {
    throw Error('اختر صورة PNG أو JPEG أو WebP أصغر من 25 ميغابايت');
  }
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 50000000) throw Error('أبعاد الصورة كبيرة جداً؛ اختَر نسخة أصغر');
    const canvas = document.createElement('canvas');
    let edge = maxEdge;
    while (edge >= 96) {
      const {width,height} = imageDimensions(bitmap.width,bitmap.height,edge);
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.imageSmoothingQuality = 'high';
      context.drawImage(bitmap,0,0,width,height);
      for (const quality of [.86,.78]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/webp',quality));
        if (blob?.type === 'image/webp' && blob.size <= maxBytes) return blob;
      }
      edge = Math.floor(Math.max(width,height) * .8);
    }
    throw Error('تعذر ضغط الصورة إلى الحجم المطلوب');
  } finally {
    bitmap.close();
  }
}
