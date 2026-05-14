<script lang="ts">
  interface CardProps {
    label: string
    value: string     // pre-formatted by the caller (e.g. "+$375K")
    subtitle: string
    focal?: boolean
  }
  interface Props {
    cards: [CardProps, CardProps, CardProps]
  }
  let { cards }: Props = $props()
</script>

<div class="c-summary">
  {#each cards as card}
    <div class="card" class:focal={card.focal}>
      <div class="lab">{card.label}</div>
      <div class="num">{card.value}</div>
      <div class="sub">{card.subtitle}</div>
    </div>
  {/each}
</div>
