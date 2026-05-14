<script lang="ts">
  interface Props {
    headline: string
    headlineAccent: string
    deck: string
  }
  let { headline, headlineAccent, deck }: Props = $props()
</script>

<div class="c-headline">
  <h1>{headline} <span class="ac">{headlineAccent}</span></h1>
  <div class="deck">{deck}</div>
</div>
