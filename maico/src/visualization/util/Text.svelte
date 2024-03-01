<script>
    import { Layer } from 'svelte-canvas';
    import { spring } from 'svelte/motion';
    import * as glutil from '../../util/glyphutil.js'
    import { axisselect, brushselection } from '../../stores/stores.js'
  
    export let x = 0,
      y = 0,
      text,
      fill = 'black',
      opacity = 1;
   
    $: render = ({ context }) => {
      context.fillStyle = fill;
      context.globalAlpha = opacity
      context.fillText(text, x, y)
      context.globalAlpha = 1
    };
  </script>
  
  <Layer {render} />