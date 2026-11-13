export function validateSaleOptions(options){if(!options)return;for(const key of['retailPrice','wholesalePrice','wholesaleMin','cartonSize'])if(!Number.isSafeInteger(options[key])||options[key]<1)throw Error('أكمل أسعار المفرد والجملة والحد الأدنى وعدد قطع الكارتون بأرقام صحيحة');if(!['piece','carton'].includes(options.wholesaleBasis))throw Error('اختر سعر الجملة للقطعة أو للكارتون');}
export function purchaseTerms(product,merchant,type='wholesale'){
 if(!['wholesale','retail'].includes(type))throw Error('اختر مفرد أو جملة');
 const options=product.saleOptions;
 if(type==='retail'&&(merchant?.saleMode!=='wholesale_retail'||!options))throw Error('المفرد غير مفعّل لهذا المنتج');
 if(!options)return {type:'wholesale',price:product.cost??product.price,min:product.min,unitsPerSale:1,unit:product.unit,label:'جملة'};
 validateSaleOptions(options);
 if(type==='retail')return {type,price:options.retailPrice,min:1,unitsPerSale:1,unit:'مفرد — قطعة',label:'مفرد'};
 const units=options.wholesaleBasis==='carton'?options.cartonSize:1;
 return {type,price:options.wholesalePrice,min:Math.ceil(options.wholesaleMin/units),unitsPerSale:units,minimumPieces:Math.ceil(options.wholesaleMin/units)*units,unit:units>1?`جملة — كارتون ${units} قطعة`:'جملة — قطعة',label:'جملة'};
}
export function checkPurchaseQuantity(product,terms,qty){if(!Number.isSafeInteger(qty)||qty<terms.min)throw Error('أقل كمية '+terms.min+' '+terms.unit);const units=qty*terms.unitsPerSale;if(!Number.isSafeInteger(units))throw Error('الكمية كبيرة جداً');if(product.stock!==null&&units>product.stock)throw Error('الكمية المطلوبة غير متوفرة');return units;}
