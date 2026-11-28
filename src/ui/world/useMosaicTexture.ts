import { useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { CanvasTexture, ClampToEdgeWrapping, SRGBColorSpace, type Texture } from 'three';
import type { MosaicLayout } from '../../domain/geo/imagery';
import type { Route } from '../../domain/route/route';
import { loadRouteImagery } from '../../tiles/imagery';

export interface MosaicTexture {
  texture: Texture;
  layout: MosaicLayout;
}

/**
 * The cached satellite photo of a route at zoom `z` as a texture, no larger than
 * `maxPx` nor than what the graphics card takes. Null meanwhile or when there
 * is none. Must be used inside the 3D canvas.
 */
export function useMosaicTexture(route: Route, z: number, maxPx: number): MosaicTexture | null {
  const gl = useThree((s) => s.gl);
  const [state, setState] = useState<MosaicTexture | null>(null);
  useEffect(() => {
    let alive = true;
    let made: Texture | null = null;
    const limit = Math.min(maxPx, gl.capabilities.maxTextureSize);
    void loadRouteImagery(route, z, limit).then((pic) => {
      if (!alive || !pic) return;
      const texture = new CanvasTexture(pic.canvas);
      texture.colorSpace = SRGBColorSpace;
      // v grows south from the top row (see mosaicUvs): no flip.
      texture.flipY = false;
      texture.wrapS = ClampToEdgeWrapping;
      texture.wrapT = ClampToEdgeWrapping;
      texture.anisotropy = gl.capabilities.getMaxAnisotropy();
      made = texture;
      setState({ texture, layout: pic.layout });
    });
    return () => {
      alive = false;
      made?.dispose();
      setState(null);
    };
  }, [route, z, maxPx, gl]);
  return state;
}
