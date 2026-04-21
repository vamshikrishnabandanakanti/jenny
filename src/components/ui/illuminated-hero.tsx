import React from 'react';
import { cn } from '@/lib/utils';

export function IlluminatedHero() {
	return (
		<div className="relative w-full flex h-screen flex-wrap items-center justify-center overflow-hidden bg-black text-[calc(var(--size)*0.022)] text-white [--factor:min(1000px,100vh)] [--size:min(var(--factor),100vw)]">
			<div className="bg absolute h-full w-full max-w-[44em] pointer-events-none">
				<div className="shadow-bgt absolute size-full translate-y-[-70%] scale-[1.3] animate-[onloadbgt_1.5s_ease-in-out_forwards] rounded-[100em] opacity-80" />
				<div className="shadow-bgb absolute size-full translate-y-[70%] scale-[1.3] animate-[onloadbgb_1.5s_ease-in-out_forwards] rounded-[100em] opacity-80" />
			</div>

			<div className="relative z-10 text-center px-4">
				<div className="text-4xl md:text-6xl font-semibold opacity-90 mb-2">
					Introducing
				</div>
				<div
					className={cn(
						'relative text-5xl md:text-8xl font-bold tracking-tighter leading-none',
						'animate-[onloadopacity_1s_ease-out_forwards]'
					)}
					style={{ filter: 'url(#glow-4)' }}
					data-text="Illuminated Glow Text."
				>
					Illuminated Glow Text.
				</div>
				<div className="text-4xl md:text-6xl font-semibold opacity-90 mt-2">
					Highlight the main focus text.
				</div>
			</div>

			<p className="absolute bottom-20 m-auto max-w-[32em] bg-gradient-to-t from-[#86868b] to-[#bdc2c9] bg-clip-text text-center font-semibold text-transparent z-10 px-6 text-sm md:text-base leading-relaxed">
				Experience a new way to draw attention to key elements with stunning{' '}
				<span className="relative inline-block font-black text-[#e7dfd6]">
					illuminated text.
				</span>{' '}
				Perfect for making a bold statement, this dynamic design ensures your
				content stands out effortlessly.
			</p>

			<svg
				className="absolute -z-1 h-0 w-0"
				width="1440px"
				height="300px"
				viewBox="0 0 1440 300"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<filter
						id="glow-4"
						colorInterpolationFilters="sRGB"
						x="-50%"
						y="-200%"
						width="200%"
						height="500%"
					>
						<feGaussianBlur
							in="SourceGraphic"
							stdDeviation="4"
							result="blur4"
						/>
						<feGaussianBlur
							in="SourceGraphic"
							stdDeviation="12"
							result="blur12"
						/>
						<feGaussianBlur
							in="SourceGraphic"
							stdDeviation="20"
							result="blur20"
						/>
						<feGaussianBlur
							in="SourceGraphic"
							stdDeviation="35"
							result="blur35"
						/>

						{/* Layer 0 - Sharp white core */}
						<feColorMatrix
							in="blur4"
							result="color-0-blur"
							type="matrix"
							values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 0.9 0"
						/>

						{/* Layer 1 - Inner amber glow */}
						<feColorMatrix
							in="blur12"
							result="color-1-blur"
							type="matrix"
							values="1 0 0 0 0
                      0 0.6 0 0 0
                      0 0 0.3 0 0
                      0 0 0 1 0"
						/>

						{/* Layer 2 - Middle orange glow */}
						<feColorMatrix
							in="blur20"
							result="color-2-blur"
							type="matrix"
							values="1 0 0 0 0
                      0 0.4 0 0 0
                      0 0 0.1 0 0
                      0 0 0 0.8 0"
						/>

						{/* Layer 3 - Outer deep orange glow */}
						<feColorMatrix
							in="blur35"
							result="color-3-blur"
							type="matrix"
							values="1 0 0 0 0
                      0 0.3 0 0 0
                      0 0 0 0.05 0 0
                      0 0 0 0.6 0"
						/>

						<feMerge>
							<feMergeNode in="color-3-blur" />
							<feMergeNode in="color-2-blur" />
							<feMergeNode in="color-1-blur" />
							<feMergeNode in="color-0-blur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>
			</svg>
		</div>
	);
}
