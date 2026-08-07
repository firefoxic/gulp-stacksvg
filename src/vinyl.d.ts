declare module "vinyl" {
	interface VinylOptions {
		path?: string,

		contents?: Buffer | null,
	}

	class Vinyl {
		public constructor (options?: VinylOptions)

		public path: string

		public base: string

		public cwd: string

		public contents: Buffer | null

		public relative: string

		public isStream (): boolean

		public isNull (): boolean

		public isBuffer (): this is Vinyl & { contents: Buffer }
	}

	export = Vinyl
}
