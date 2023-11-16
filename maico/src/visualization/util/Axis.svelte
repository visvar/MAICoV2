<script>
	import { axisselect } from "../../stores/stores";

	import { Layer } from "svelte-canvas";

	export let scale,
		tickSize = 4,
		margin,
		tickNumber = 10,
		type = "x";

	$: ticks = scale.ticks(tickNumber);

	$: render = ({ context, width, height }) => {
		context.strokeStyle = "#333";
		context.beginPath();

		ticks.forEach((d) => {
			if (type === "x") {
				context.moveTo(scale(d), height - margin.bottom);
				context.lineTo(scale(d), height - margin.bottom + tickSize);
			} else if (type === "y") {
				context.moveTo(margin.left, scale(d));
				context.lineTo(margin.left - tickSize, scale(d));
			}
		});

		context.textAlign = type === "x" ? "center" : "right";
		context.textBaseline = type === "x" ? "top" : "middle";
		context.fillStyle = "#333";

		ticks.forEach((d) => {
			if (type === "x") {
				context.fillText(
					d,
					scale(d),
					height - margin.bottom + tickSize + 1
				);
			} else if (type === "y") {
				context.fillText(d, margin.left - tickSize - 1, scale(d));
			}
		});
		context.save();
		context.font = "15px sans-serif";
		context.textAlign = "center";
		if (type === "x") {
			context.fillText(
				$axisselect[0]?.label,
				(width - margin.left - margin.right) / 2,
				margin.top / 2
			);
			context.strokeStyle = "#333";
			context.stroke();
		} else if (type === "y") {
			context.save();
			context.translate(
				(width - margin.left - margin.right) / 2,
				(height - margin.top - margin.bottom) / 2
			);
			context.rotate(Math.PI / 2);
			context.fillText(
				$axisselect[1]?.label,
				0,
				-height / 2
				//width - margin.right / 2,
				//(height - margin.top - margin.bottom) / 2
			);
			context.strokeStyle = "#333";
			context.stroke();
			context.restore();
		}
		context.restore();
	};
</script>

<Layer {render} />
