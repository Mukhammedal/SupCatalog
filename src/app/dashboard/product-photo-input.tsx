"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";

const MAX_PHOTOS = 12;
const MAX_PHOTO_SIZE_MB = 8;
const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

type SelectedPhoto = {
  file: File;
  id: string;
  url: string;
};

function buildPhotoId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
}

export function ProductPhotoInput({
  helpText,
  label,
  totalLimit = MAX_PHOTOS,
  usedSlots = 0,
}: {
  helpText?: string;
  label: string;
  totalLimit?: number;
  usedSlots?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<SelectedPhoto[]>([]);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const normalizedTotalLimit = Math.min(
    MAX_PHOTOS,
    Math.max(0, Math.floor(totalLimit)),
  );
  const normalizedUsedSlots = Math.min(
    normalizedTotalLimit,
    Math.max(0, Math.floor(usedSlots)),
  );
  const selectableLimit = normalizedTotalLimit - normalizedUsedSlots;

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
  }, []);

  function syncInputFiles(nextPhotos: SelectedPhoto[]) {
    if (!inputRef.current) {
      return;
    }

    const transfer = new DataTransfer();

    nextPhotos.forEach((photo) => {
      transfer.items.add(photo.file);
    });

    inputRef.current.files = transfer.files;
  }

  function applyFiles(files: File[]) {
    const validFiles = files.filter((file) => file.size <= MAX_PHOTO_SIZE_BYTES);
    const rejectedLarge = files.length - validFiles.length;
    const availableSlots = selectableLimit - photos.length;
    const acceptedFiles = validFiles.slice(0, Math.max(availableSlots, 0));
    const rejectedCount = validFiles.length - acceptedFiles.length;

    if (!acceptedFiles.length) {
      if (rejectedLarge) {
        setMessage(`Фото больше ${MAX_PHOTO_SIZE_MB} MB не добавлены.`);
      } else if (photos.length >= selectableLimit) {
        setMessage(`Уже выбрано ${normalizedTotalLimit}/${normalizedTotalLimit} фото.`);
      }
      return;
    }

    const acceptedPhotos = acceptedFiles.map((file) => ({
      file,
      id: buildPhotoId(file),
      url: URL.createObjectURL(file),
    }));
    const nextPhotos = [...photos, ...acceptedPhotos];

    photosRef.current = nextPhotos;
    setPhotos(nextPhotos);
    syncInputFiles(nextPhotos);

    const totalSelected = normalizedUsedSlots + nextPhotos.length;
    const details = [
      `Выбрано ${totalSelected}/${normalizedTotalLimit}.`,
      normalizedUsedSlots ? `Новых ${nextPhotos.length}.` : "",
      rejectedCount ? `Лишние ${rejectedCount} не добавлены.` : "",
      rejectedLarge ? `Больше ${MAX_PHOTO_SIZE_MB} MB: ${rejectedLarge}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    setMessage(details);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    applyFiles(Array.from(event.currentTarget.files ?? []));
  }

  function removePhoto(photoId: string) {
    const removedPhoto = photos.find((photo) => photo.id === photoId);
    const nextPhotos = photos.filter((photo) => photo.id !== photoId);

    if (removedPhoto) {
      URL.revokeObjectURL(removedPhoto.url);
    }

    setPhotos(nextPhotos);
    photosRef.current = nextPhotos;
    syncInputFiles(nextPhotos);
    setMessage(
      nextPhotos.length
        ? `Выбрано ${normalizedUsedSlots + nextPhotos.length}/${normalizedTotalLimit}.`
        : null,
    );
  }

  function openPicker() {
    inputRef.current?.click();
  }

  const remaining = selectableLimit - photos.length;
  const totalSelected = normalizedUsedSlots + photos.length;
  const displayMessage =
    message ?? helpText ?? `Можно выбрать до ${selectableLimit} фото.`;

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {displayMessage}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          {totalSelected}/{normalizedTotalLimit}
        </span>
      </div>

      <input
        accept="image/*"
        className="sr-only"
        multiple
        name="photos"
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />

      {photos.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <div
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
              key={photo.id}
            >
              <Image
                alt={photo.file.name}
                className="h-full w-full object-cover"
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 180px"
                src={photo.url}
                unoptimized
              />
              {index === 0 ? (
                <span className="absolute bottom-2 left-2 rounded-md bg-slate-950 px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
                  Главное
                </span>
              ) : null}
              <button
                aria-label={`Удалить ${photo.file.name}`}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-base font-semibold text-white shadow-sm transition hover:bg-rose-600"
                onClick={() => removePhoto(photo.id)}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {remaining > 0 ? (
        <button
          className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-slate-400 hover:bg-white"
          onClick={openPicker}
          type="button"
        >
          <span className="text-4xl font-light leading-none text-slate-400">+</span>
          <span className="mt-2 text-sm font-semibold text-slate-700">
            {photos.length ? `Добавить фото (ещё ${remaining})` : "Выбрать фото"}
          </span>
          <span className="mt-1 text-xs font-medium text-slate-500">
            PNG, JPG, WebP · до {MAX_PHOTO_SIZE_MB} MB
          </span>
        </button>
      ) : null}
    </section>
  );
}
