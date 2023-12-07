<script>
	import { onMount } from "svelte";
	import { clamp } from "yootils";
	import * as d3 from "d3";

	let start = 0;
	let end = 1;
	export let values;
	export let title;
	export let change;

	let leftHandle;
	let body;
	let slider;
	let extend = $values[1];
	let scale = d3.scaleLinear().domain(extend).range([0, 1]);

	onMount(() => {
		extend = $values[1];
		scale = d3.scaleLinear().domain(extend).range([0, 1]);
		start = scale($values[0][0]);
		end = scale($values[0][1]);
	});
	function draggable(node) {
		let x;
		let y;
		function handleMousedown(event) {
			if (event.type === "touchstart") {
				event = event.touches[0];
			}
			x = event.clientX;
			y = event.clientY;
			node.dispatchEvent(
				new CustomEvent("dragstart", {
					detail: { x, y },
				})
			);
			window.addEventListener("mousemove", handleMousemove);
			window.addEventListener("mouseup", handleMouseup);
			window.addEventListener("touchmove", handleMousemove);
			window.addEventListener("touchend", handleMouseup);
		}
		function handleMousemove(event) {
			if (event.type === "touchmove") {
				event = event.changedTouches[0];
			}
			const dx = event.clientX - x;
			const dy = event.clientY - y;
			x = event.clientX;
			y = event.clientY;
			node.dispatchEvent(
				new CustomEvent("dragmove", {
					detail: { x, y, dx, dy },
				})
			);
		}
		function handleMouseup(event) {
			x = event.clientX;
			y = event.clientY;
			node.dispatchEvent(
				new CustomEvent("dragend", {
					detail: { x, y },
				})
			);
			window.removeEventListener("mousemove", handleMousemove);
			window.removeEventListener("mouseup", handleMouseup);
			window.removeEventListener("touchmove", handleMousemove);
			window.removeEventListener("touchend", handleMouseup);
		}
		node.addEventListener("mousedown", handleMousedown);
		node.addEventListener("touchstart", handleMousedown);
		return {
			destroy() {
				node.removeEventListener("mousedown", handleMousedown);
				node.removeEventListener("touchstart", handleMousedown);
			},
		};
	}
	function setHandlePosition(which) {
		return function (evt) {
			const { left, right } = slider.getBoundingClientRect();
			const parentWidth = right - left;
			const p = Math.min(
				Math.max((evt.detail.x - left) / parentWidth, 0),
				1
			);
			if (which === "start") {
				start = p;
				end = Math.max(end, p);
			} else {
				start = Math.min(p, start);
				end = p;
			}
		};
	}
	function setHandlesFromBody(event) {
		const { width } = body.getBoundingClientRect();
		const { left, right } = slider.getBoundingClientRect();
		const parentWidth = right - left;
		const leftHandleLeft = leftHandle.getBoundingClientRect().left;
		const pxStart = clamp(
			leftHandleLeft + event.detail.dx - left,
			0,
			parentWidth - width
		);
		const pxEnd = clamp(pxStart + width, width, parentWidth);
		const pStart = pxStart / parentWidth;
		const pEnd = pxEnd / parentWidth;
		start = pStart;
		end = pEnd;
	}

	function setPosition(which) {
		return function (evt) {
			const { left, right } = slider.getBoundingClientRect();
			const parentWidth = right - left;
			const p = Math.min(
				Math.max((evt.detail.x - left) / parentWidth, 0),
				1
			);
			if (which === "start") {
				change([[scale.invert(p), scale.invert(Math.max(end, p))],extend])
				values.set([
					[scale.invert(p), scale.invert(Math.max(end, p))],
					extend,
				]);
			} else {
				change([
					[scale.invert(Math.min(p, start)), scale.invert(p)],
					extend,
				])
				values.set([
					[scale.invert(Math.min(p, start)), scale.invert(p)],
					extend,
				]);
			}
		};
	}
</script>

<div class="double-range-container">
	<div>{title}</div>
	<div class="slider" bind:this={slider}>
		<div class="vl">
			{scale.invert(start).toFixed(2)}
		</div>
		<div class="vr">
			{scale.invert(end).toFixed(2)}
		</div>
		<div
			class="body"
			bind:this={body}
			use:draggable
			on:dragmove|preventDefault|stopPropagation={setHandlesFromBody}
			style="
				left: {100 * start}%;
				right: {100 * (1 - end)}%;
			"
		/>
		<div
			class="handle"
			bind:this={leftHandle}
			data-which="start"
			use:draggable
			on:dragmove|preventDefault|stopPropagation={setHandlePosition(
				"start"
			)}
			on:dragend|preventDefault|stopPropagation={setPosition("start")}
			style="
				left: {100 * start}%
			"
		/>
		<div
			class="handle"
			data-which="end"
			use:draggable
			on:dragmove|preventDefault|stopPropagation={setHandlePosition(
				"end"
			)}
			on:dragend|preventDefault|stopPropagation={setPosition("end")}
			style="
				left: {100 * end}%
			"
		/>
	</div>
</div>

<style>
	.double-range-container {
		width: 75%;
		height: 20px;
		margin-left: 15%;
		margin-right: 15%;
		user-select: none;
		box-sizing: border-box;
		white-space: nowrap;
	}
	.slider {
		position: relative;
		width: 100%;
		height: 6px;
		top: 50%;
		transform: translate(0, -50%);
		background-color: #e2e2e2;
		box-shadow: inset 0 7px 10px -5px #4a4a4a, inset 0 -1px 0px 0px #9c9c9c;
		border-radius: 1px;
	}
	.vl {
		position: absolute;
		top: 80%;
		left: -5%;
	}
	.vr {
		position: absolute;
		top: 80%;
		left: 90%;
	}
	.handle {
		position: absolute;
		top: 50%;
		width: 0;
		height: 0;
	}
	.handle::before {
		content: " ";
		box-sizing: border-box;
		position: absolute;
		border-radius: 50%;
		width: 16px;
		height: 16px;
		background-color: #fdfdfd;
		border: 1px solid #7b7b7b;
		transform: translate(-50%, -50%);
	}
	/* .handle[data-which="end"]:after{
		transform: translate(-100%, -50%);
	} */
	.handle:active:after {
		background-color: #ddd;
		z-index: 9;
	}
	.body {
		top: 0;
		position: absolute;
		background-color: #34a1ff;
		bottom: 0;
	}
</style>
