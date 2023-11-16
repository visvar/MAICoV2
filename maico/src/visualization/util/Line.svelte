<script>
    import { Layer } from 'svelte-canvas';
    import { spring } from 'svelte/motion';
    import * as glutil from '../../util/glyphutil.js'
    import { axisselect, brushselection } from '../../stores/stores.js'
  
    export let x1 = 0,
      y1 = 0,
      x2 = 0,
      y2 = 0,
      stroke = 'red',
      strokeWidth = 1,
      opacity = 0.25;
   
    $: render = ({ context }) => {
      context.strokeStyle = stroke;
      context.strokeWidth = strokeWidth;
      context.globalAlpha = opacity
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);      
      context.stroke();
      context.globalAlpha = 1
    };
  </script>
  
  <Layer {render} />