import { Quality } from "./Quality";
import Integer1To100 from "./simple_types";

export class QualityPercentage {

	constructor(
		private _quality: Quality,
		private _percentage: Integer1To100,
	) {
		this._quality = _quality;
		this._percentage = _percentage;
	}

	static fromJSONObject({
		_quality,
		_percentage,
	}: QualityPercentage) {
		return new QualityPercentage(_quality, _percentage);
	}

	get quality(): Quality {
		return this._quality;
	}
	set quality(quality: Quality) {
		this._quality = quality;
	}

	get percentage(): Integer1To100 {
		return this._percentage;
	}
	set percentage(percentage: Integer1To100) {
		this._percentage = percentage;
	}

	get name(): string {
		return this._quality.name;
	}

	get benchmarks(): { [benchmark_name: string]: number } | undefined {
		return this._quality.benchmarks;
	}
}