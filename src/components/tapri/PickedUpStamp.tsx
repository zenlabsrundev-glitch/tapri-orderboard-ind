/**
 * Satisfying angled "PICKED UP" stamp overlay.
 * Sits absolutely over the order card — animates in via stamp-slam.
 */
export const PickedUpStamp = () => {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          animation: 'stamp-slam 0.55s cubic-bezier(0.2, 0.9, 0.4, 1) forwards',
        }}
      >
        <div
          className="border-[5px] border-neon rounded-md px-4 py-1.5 bg-neon/10 backdrop-blur-[1px]"
          style={{
            boxShadow: '0 0 0 2px hsl(var(--neon) / 0.25), inset 0 0 0 1px hsl(var(--neon) / 0.4)',
          }}
        >
          <div className="font-display font-extrabold text-neon text-2xl tracking-widest leading-none">
            PICKED UP
          </div>
          <div className="font-handwritten text-neon/90 text-base leading-none mt-0.5 text-center">
            ✓ Served Fresh
          </div>
        </div>
      </div>
    </div>
  );
};
