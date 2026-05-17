import Image from "next/image";

export function baseOptions() {
  return {
    nav: {
      title: <div className="flex items-center gap-2"><Image width={300} height={300} className="h-[40px] w-auto" src="/accent-logo-shield.png" alt="MelMe Logo" /> <Image width={300} height={300} className="h-[40px] w-auto" src="/accent-logo-text.png" alt="MelMe Logo" /></div>,
    },
  };
}
