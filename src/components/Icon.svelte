<script>
  let { name, class: className = "w-5 h-5", strokeWidth = 2 } = $props();

  const paths = {
    "chevron-left": "M15.75 19.5 8.25 12l7.5-7.5",
    "chevron-right": "m8.25 4.5 7.5 7.5-7.5 7.5",
    check: "m4.5 12.75 6 6 9-13.5",
  };
</script>

<svg
  class={className}
  fill="none"
  viewBox="0 0 24 24"
  stroke-width={strokeWidth}
  stroke="currentColor"
>
  <path stroke-linecap="round" stroke-linejoin="round" d={paths[name]} />
</svg>