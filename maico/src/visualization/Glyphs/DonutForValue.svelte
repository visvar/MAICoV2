<script>
    import { Layer } from 'svelte-canvas';
    import { spring } from 'svelte/motion';
    import * as gu from '../../util/glyphutil'
    import * as mvlib from 'musicvis-lib';
    import * as d3 from 'd3'
  
    export let x = 0,
      y = 0,
      r = 10,
      r2 = 2,
      percent = 0.5,
      round = true,
      color = 'grey'
  
    $: render = ({ context }) => {  
        let radius2 = r+r2
        if(percent >0)
        if(round){
            context.strokeStyle = color
            context.strokeWidth = r2
            context.moveTo(x, y)
            context.beginPath()
            context.arc(x, y, radius2, -(Math.PI/2), (2*percent*(Math.PI)-(Math.PI/2)) % (Math.PI * 2), false)
            context.stroke()
        }else{
            const xscale1 = d3.scaleLinear().domain([0, 0.125]).range([0,radius2] )
            const xscale2 = d3.scaleLinear().domain([0.625, 0.375]).range([-radius2 ,radius2] )
            const xscale3 = d3.scaleLinear().domain([0.875, 1]).range([-radius2,0] )
            const yscale1 = d3.scaleLinear().domain([0.125, 0.375] ).range([-radius2 ,radius2] )
            const yscale2 = d3.scaleLinear().domain([0.875, 0.625]).range([-radius2 ,radius2] )
            let xL = 0
            let yL = 0
            context.strokeStyle = color
            context.strokeWidth = r2

            if(percent === 1&&false){
                mvlib.Canvas.drawRoundedRect(context, x - radius2, y - radius2 , 2*radius2, 2*radius2 )
                context.stroke()
            }else{
           
            
            if(percent <= 0.125){
                xL = xscale1(percent)
                mvlib.Canvas.drawLine(context, x, y - radius2 , x + xL, y - radius2 )
                context.stroke()
            }
            if(percent > 0.125){
                mvlib.Canvas.drawLine(context, x, y - radius2 , x + radius2 , y - radius2 )
                context.stroke()
            }
            if(percent <= 0.375 && percent > 0.125){
                yL = yscale1(percent)
                mvlib.Canvas.drawLine(context, x + radius2 , y - radius2 , x + radius2 , y + yL)
                context.stroke()
            }
            if(percent > 0.375){
                mvlib.Canvas.drawLine(context, x + radius2 , y - radius2 , x + radius2 , y + radius2 )
                context.stroke()
            }
            if(percent <= 0.625 && percent > 0.375){ 
                xL = xscale2(percent)
                mvlib.Canvas.drawLine(context, x + radius2 , y + radius2 , x + xL, y+ radius2 )
                context.stroke()
            }
            if(percent >0.625){
                mvlib.Canvas.drawLine(context, x + radius2 , y + radius2 , x - radius2 , y+ radius2 )
                context.stroke()
            }
            if(percent <=0.875 && percent >0.625){
                yL = yscale2(percent)
                mvlib.Canvas.drawLine(context, x - radius2 , y + (radius2) , x - radius2 , y - yL)
                context.stroke()
            }
            if(percent >0.875){
                mvlib.Canvas.drawLine(context, x - radius2 , y + (radius2) , x - radius2 , y - radius2 )
                context.stroke()
                xL = xscale3(percent)
                mvlib.Canvas.drawLine(context, x - radius2 , y - radius2 , x  + xL, y - radius2 )
                context.stroke()
            }
        }
        }
        
    };
  </script>
  
  <Layer {render} />