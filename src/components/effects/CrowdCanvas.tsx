"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";

/* ──────────────────────────────────────────────────────────────────────────
 * CrowdCanvas — sprite-sheet walking figures (Skiper39)
 *
 * Loads the OpenPeeps all-peeps sprite sheet and animates walking figures
 * across the canvas using GSAP timelines.
 *
 * The canvas fills its parent container via absolute inset-0. The parent
 * must have explicit width/height for the canvas to size correctly.
 *
 * Respects prefers-reduced-motion: renders a single static frame.
 *
 * Requires: /public/images/peeps/all-peeps.png
 * ────────────────────────────────────────────────────────────────────────── */

interface CrowdCanvasProps {
  src?: string;
  rows?: number;
  cols?: number;
  className?: string;
}

const CrowdCanvas = ({
  src = "/images/peeps/all-peeps.png",
  rows = 15,
  cols = 7,
  className = "",
}: CrowdCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const config = { src, rows, cols };

    // UTILS
    const randomRange = (min: number, max: number) =>
      min + Math.random() * (max - min);
    const randomIndex = (array: unknown[]) => randomRange(0, array.length) | 0;
    const removeFromArray = (array: unknown[], i: number) =>
      array.splice(i, 1)[0];
    const removeItemFromArray = (array: unknown[], item: unknown) =>
      removeFromArray(array, array.indexOf(item));
    const removeRandomFromArray = (array: unknown[]) =>
      removeFromArray(array, randomIndex(array));
    const getRandomFromArray = (array: unknown[]) =>
      array[randomIndex(array) | 0];

    // TWEEN FACTORIES
    const resetPeep = ({
      stage,
      peep,
    }: {
      stage: { width: number; height: number };
      peep: Peep;
    }) => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const offsetY =
        100 - 250 * gsap.parseEase("power2.in")(Math.random());
      const startY = stage.height - peep.height + offsetY;
      let startX: number;
      let endX: number;

      if (direction === 1) {
        startX = -peep.width;
        endX = stage.width;
        peep.scaleX = 1;
      } else {
        startX = stage.width + peep.width;
        endX = 0;
        peep.scaleX = -1;
      }

      peep.x = startX;
      peep.y = startY;
      peep.anchorY = startY;

      return { startX, startY, endX };
    };

    const normalWalk = ({
      peep,
      props,
    }: {
      peep: Peep;
      props: { startX: number; startY: number; endX: number };
    }) => {
      const { startX, startY, endX } = props;
      const xDuration = 10;
      const yDuration = 0.25;

      const tl = gsap.timeline();
      tl.timeScale(randomRange(0.5, 1.5));
      tl.to(peep, { duration: xDuration, x: endX, ease: "none" }, 0);
      tl.to(
        peep,
        {
          duration: yDuration,
          repeat: xDuration / yDuration,
          yoyo: true,
          y: startY - 10,
        },
        0
      );

      return tl;
    };

    const walks = [normalWalk];

    // TYPES
    type Peep = {
      image: HTMLImageElement;
      rect: number[];
      width: number;
      height: number;
      x: number;
      y: number;
      anchorY: number;
      scaleX: number;
      walk: gsap.core.Timeline | null;
      setRect: (rect: number[]) => void;
      render: (ctx: CanvasRenderingContext2D) => void;
    };

    // FACTORY
    const createPeep = ({
      image,
      rect,
    }: {
      image: HTMLImageElement;
      rect: number[];
    }): Peep => {
      const peep: Peep = {
        image,
        rect: [],
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        anchorY: 0,
        scaleX: 1,
        walk: null,
        setRect: (rect: number[]) => {
          peep.rect = rect;
          peep.width = rect[2];
          peep.height = rect[3];
        },
        render: (ctx: CanvasRenderingContext2D) => {
          ctx.save();
          ctx.translate(peep.x, peep.y);
          ctx.scale(peep.scaleX, 1);
          ctx.drawImage(
            peep.image,
            peep.rect[0],
            peep.rect[1],
            peep.rect[2],
            peep.rect[3],
            0,
            0,
            peep.width,
            peep.height
          );
          ctx.restore();
        },
      };
      peep.setRect(rect);
      return peep;
    };

    // MAIN
    const img = document.createElement("img");
    const stage = { width: 0, height: 0 };
    const allPeeps: Peep[] = [];
    const availablePeeps: Peep[] = [];
    const crowd: Peep[] = [];

    const createPeeps = () => {
      const { rows, cols } = config;
      const { naturalWidth: width, naturalHeight: height } = img;
      const total = rows * cols;
      const rectWidth = width / rows;
      const rectHeight = height / cols;

      for (let i = 0; i < total; i++) {
        allPeeps.push(
          createPeep({
            image: img,
            rect: [
              (i % rows) * rectWidth,
              ((i / rows) | 0) * rectHeight,
              rectWidth,
              rectHeight,
            ],
          })
        );
      }
    };

    const initCrowd = () => {
      while (availablePeeps.length) {
        addPeepToCrowd().walk?.progress(Math.random());
      }
    };

    const addPeepToCrowd = () => {
      const peep = removeRandomFromArray(availablePeeps) as Peep;
      const walk = (
        getRandomFromArray(walks) as typeof normalWalk
      )({
        peep,
        props: resetPeep({ peep, stage }),
      }).eventCallback("onComplete", () => {
        removePeepFromCrowd(peep);
        addPeepToCrowd();
      });

      peep.walk = walk;
      crowd.push(peep);
      crowd.sort((a, b) => a.anchorY - b.anchorY);
      return peep;
    };

    const removePeepFromCrowd = (peep: Peep) => {
      removeItemFromArray(crowd, peep);
      availablePeeps.push(peep);
    };

    const render = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(devicePixelRatio, devicePixelRatio);
      crowd.forEach((peep) => peep.render(ctx));
      ctx.restore();
    };

    const resize = () => {
      if (!canvas) return;
      stage.width = canvas.clientWidth;
      stage.height = canvas.clientHeight;
      if (stage.width === 0 || stage.height === 0) return; // not laid out yet
      canvas.width = stage.width * devicePixelRatio;
      canvas.height = stage.height * devicePixelRatio;

      crowd.forEach((peep) => peep.walk?.kill());
      crowd.length = 0;
      availablePeeps.length = 0;
      availablePeeps.push(...allPeeps);
      initCrowd();
    };

    const init = () => {
      createPeeps();

      if (prefersReducedMotion) {
        // Static mode: set stage, position peeps, render once
        stage.width = canvas.clientWidth;
        stage.height = canvas.clientHeight;
        if (stage.width === 0 || stage.height === 0) return;
        canvas.width = stage.width * devicePixelRatio;
        canvas.height = stage.height * devicePixelRatio;
        allPeeps.forEach((peep) => {
          resetPeep({ peep, stage });
          crowd.push(peep);
        });
        crowd.sort((a, b) => a.anchorY - b.anchorY);
        render();
      } else {
        resize();
        gsap.ticker.add(render);
      }
    };

    img.onload = init;
    img.src = config.src;

    // ResizeObserver ensures resize re-runs when the parent container
    // gets real layout dimensions (fixes the timing issue where the
    // canvas renders before the parent has been laid out).
    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(canvas);

    return () => {
      img.onload = null;
      ro.disconnect();
      if (!prefersReducedMotion) gsap.ticker.remove(render);
      crowd.forEach((peep) => {
        if (peep.walk) peep.walk.kill();
      });
    };
  }, [src, rows, cols]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
};

export default CrowdCanvas;

/*
 * ─── Attribution ────────────────────────────────────────────────────────────
 *
 * Skiper 39 Canvas_Landing_004 — React + Canvas
 * Inspired by and adapted from https://codepen.io/zadvorsky/pen/xxwbBQV
 * illustration by https://www.openpeeps.com/
 * We respect the original creators. This is an inspired rebuild with our own taste
 * and does not claim any ownership.
 * These animations aren't associated with the codepen.io. They're independent
 * recreations meant to study interaction design.
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Feedback and contributions are welcome.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.me
 * Twitter: https://x.com/Gur__vi
 *
 * OpenPeeps illustration set by Micah Taylor
 * https://www.openpeeps.com/
 * Licensed under CC-BY 4.0
 * https://creativecommons.org/licenses/by/4.0/
 */
