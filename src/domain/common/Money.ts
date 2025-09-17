export class Money {
  private readonly amount: number;

  constructor(amount: number) {
    if (!Number.isFinite(amount)) throw new Error('Money must be finite');
    this.amount = Math.round(amount * 100) / 100;
  }

  public get value(): number {
    return this.amount;
  }

  public add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  public subtract(other: Money): Money {
    return new Money(this.amount - other.amount);
  }

  public isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  public isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  public isNegative(): boolean {
    return this.amount < 0;
  }

  public format(locale: string = 'en-US', currency: string = 'USD'): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(this.amount);
    } catch {
      return this.amount.toFixed(2);
    }
  }
}


