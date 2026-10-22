import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Los tamaños de texto con nombre de globals.css (prompts/052). Sin esto, tailwind-merge
// los toma por colores y borra el color de texto al combinarlos (por ejemplo
// `text-white text-small` quedaba sin `text-white`).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'title', 'heading', 'body', 'small', 'caption'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
