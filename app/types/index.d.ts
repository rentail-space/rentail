declare module "date-buddy" {
  export function timeAgo(date: Date | number | string): string;
  export declare function timeUntil(date: Date): string;
  export declare function formatDate(date: Date): string;
  export declare function formatDateWithDay(date: Date): string;
}
