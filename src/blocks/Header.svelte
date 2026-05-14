<script lang="ts">
  interface Props {
    product: string
    context: string
    date: string
    title: string
  }
  let { product, context, date, title }: Props = $props()
</script>

<div class="c-header">
  <div class="left">
    <span><span class="a">●</span> {title}</span>
    <span>{product}</span>
  </div>
  <div class="right">
    <span>{context}</span>
    <span>{date}</span>
  </div>
</div>
