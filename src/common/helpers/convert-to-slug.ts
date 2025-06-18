export const convertToSlug = (text: string) => {
    return text
        .toLowerCase()                        // Convierte el texto a minúsculas
        .trim()                               // Elimina los espacios en blanco al inicio y al final
        .replace(/[\s\W-]+/g, '-')            // Reemplaza los espacios y caracteres no alfanuméricos por guiones
        .replace(/^-+|-+$/g, '');             // Elimina los guiones al inicio y al final
}