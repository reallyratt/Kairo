// A utility function to format a Date object into a 'YYYY-MM-DD' string, respecting the local timezone.
export const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// A utility function to parse a 'YYYY-MM-DD' string into a Date object in the user's local timezone.
// Appending 'T00:00:00' prevents browsers from defaulting to UTC.
export const dateFromYYYYMMDD = (dateString: string): Date => {
    return new Date(`${dateString}T00:00:00`);
};
