declare module 'astronomia/julian' {
  export class Calendar {
    constructor(date?: Date | number, month?: number, day?: number);
    toDate(): Date;
    toJD(): number;
    toJDE(): number;
    fromDate(date: Date): this;
  }

  export class CalendarGregorian extends Calendar {
    constructor(date?: Date | number, month?: number, day?: number);
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
  export function position(jde: number): { lon: number; lat: number; range: number; ra: number; dec: number };
  export function parallax(jde: number): number;

  const moonposition: {
    position: typeof position;
    parallax: typeof parallax;
  };

  export default moonposition;
}

declare module 'astronomia/nutation' {
  export function nutation(jde: number): [number, number];
  export function meanObliquity(jde: number): number;

  const nutationModule: {
    nutation: typeof nutation;
    meanObliquity: typeof meanObliquity;
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

declare module 'astronomia/parallax' {
  export function topocentric(
    c: { ra: number; dec: number; range: number },
    rhoSinPhi: number,
    rhoCosPhi: number,
    lonWestRad: number,
    jde: number
  ): { _ra: number; _dec: number; ra: number; dec: number };

  const parallax: {
    topocentric: typeof topocentric;
  };

  export default parallax;
}

declare module 'astronomia/globe' {
  export class Ellipsoid {
    parallaxConstants(latRad: number, height: number): [number, number];
  }

  export const Earth76: Ellipsoid;

  const globe: {
    Earth76: typeof Earth76;
  };

  export default globe;
}

declare module 'astronomia/sidereal' {
  export function apparent(jde: number): number;

  const sidereal: {
    apparent: typeof apparent;
  };

  export default sidereal;
}

declare module 'astronomia/base' {
  export function pmod(x: number, y: number): number;
  const base: {
    pmod: typeof pmod;
  };
  export default base;
}

declare module 'astronomia/iterate' {
  export function binaryRoot(f: (x: number) => number, lower: number, upper: number): number;
  const iterate: {
    binaryRoot: typeof binaryRoot;
  };
  export default iterate;
}
