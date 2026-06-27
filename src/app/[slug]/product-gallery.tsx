"use client";

import Image from "next/image";
import { useState } from "react";

type ProductGalleryProps = {
  photos: string[];
  productName: string;
};

function isGeneratedPlaceholder(photo?: string) {
  return Boolean(photo?.includes("placehold.co"));
}

function EmptyProductPhoto() {
  return (
    <div className="flex h-full flex-col justify-between bg-[linear-gradient(135deg,#f8fafc_0%,#eef2f7_58%,#e7edf5_100%)] p-5">
      <div className="h-10 w-10 rounded-xl border border-slate-300 bg-white/70" />
      <div>
        <p className="text-xs font-semibold uppercase text-slate-400">
          Фото товара
        </p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Добавьте реальные фотографии в кабинете продавца, чтобы покупатель
          видел товар перед заказом.
        </p>
      </div>
    </div>
  );
}

export function ProductGallery({ photos, productName }: ProductGalleryProps) {
  const safePhotos = photos.length ? photos : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activePhoto = safePhotos[activeIndex];

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.07)]">
        <div className="relative aspect-[4/2.75] bg-slate-100">
          {activePhoto && !isGeneratedPlaceholder(activePhoto) ? (
            <Image
              alt={productName}
              className="h-full w-full object-contain"
              height={900}
              priority
              src={activePhoto}
              width={1200}
            />
          ) : (
            <EmptyProductPhoto />
          )}
        </div>

        {safePhotos.length > 1 ? (
          <div className="absolute bottom-3 right-3 rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {activeIndex + 1} / {safePhotos.length}
          </div>
        ) : null}
      </div>

      {safePhotos.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {safePhotos.map((photo, index) => (
            <button
              aria-label={`Фото ${index + 1}`}
              className={
                activeIndex === index
                  ? "relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-slate-950 bg-white shadow-sm"
                  : "relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white opacity-70 transition hover:opacity-100"
              }
              key={`${photo}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {isGeneratedPlaceholder(photo) ? (
                <div className="h-full w-full bg-slate-100" />
              ) : (
                <Image
                  alt={`${productName} ${index + 1}`}
                  className="h-full w-full object-cover"
                  height={120}
                  src={photo}
                  width={144}
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
