declare module 'astronomia/julian' {
  export class Calendar {
    constructor(date?: Date);
    toDate(): Date;
  }

  export class CalendarGregorian {
    constructor(year?: number, month?: number, day?: number);
    toDate(): Date;
  }

  export function DateToJDE(date: Date): number;

  const julian: {
    Calendar: typeof Calendar;
    CalendarGregorian: typeof CalendarGregorian;
    DateToJDE: typeof DateToJDE;
  };

  export default julian;
}

declare module 'astronomia/solar' {
  export function apparentLongitude(t: number): number;

  const solar: {
    apparentLongitude: typeof apparentLongitude;
  };

  export default solar;
}

declare module 'astronomia/moonposition' {
  export function position(jde: number): { lon: number; lat: number; range: number };

  const moonposition: {
    position: typeof position;
  };

  export default moonposition;
}

declare module 'astronomia/nutation' {
  export function nutation(jde: number): [number, number];

  const nutationModule: {
    nutation: typeof nutation;
  };

  export default nutationModule;
}

declare module 'astronomia/sunrise' {
  type CalendarLike = {
    toDate(): Date;
  };

  export class Sunrise {
    constructor(date: unknown, lat: number, lon: number, refraction?: number);
    rise(): CalendarLike | undefined;
    set(): CalendarLike | undefined;
    noon(): CalendarLike;
  }
}

// D30: full VSOP87 for the apparent solar longitude. The truncated Meeus series
// previously used sat 2.2x outside the §1.2 Sankranti budget.
declare module 'astronomia/planetposition' {
  const planetposition: any;
  export default planetposition;
}
declare module 'astronomia/elp' {
  const elp: any;
  export default elp;
}
declare module 'astronomia/data/vsop87Bearth' {
  const data: any;
  export default data;
}
declare module 'astronomia/data/elpMppDe' {
  const data: any;
  export default data;
}
