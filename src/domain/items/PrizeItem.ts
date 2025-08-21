import { Prize } from '@/types/game';

/** ООП-обертка над призом для вычисляемых свойств и бизнес-логики. */
export class PrizeItem {
	private readonly prize: Prize;

	constructor(prize: Prize) {
		this.prize = prize;
	}

	public get data(): Prize {
		return this.prize;
	}

	public get isShard(): boolean {
		return !!this.prize.isShard;
	}

	public get rarity(): Prize['rarity'] {
		return this.prize.rarity;
	}

	public get price(): number {
		return this.prize.price;
	}
}



