<script lang="ts">
  import type { BuyItem } from '../schema'

  interface Props {
    lineItemLabel: string
    bigNumber: string    // pre-formatted, e.g. "+$375K"
    subText: string      // prose, may have inline spans via {@html}
    buysLabel: string
    items: BuyItem[]
  }
  let { lineItemLabel, bigNumber, subText, buysLabel, items }: Props = $props()
</script>

<div class="c-position">
  <div class="lead">
    <div class="label">{lineItemLabel}</div>
    <div class="big">{bigNumber}</div>
    <div class="sub">{@html subText}</div>
  </div>
  <div class="buys">
    <div class="label">{buysLabel}</div>
    <ul>
      {#each items as item}
        <li>
          <span>
            <span class={item.type === 'plus' ? 'plus' : 'x'}>{item.type === 'plus' ? '+' : '×'}</span>
            {item.text}
          </span>
          <span class="tag">{item.tag}</span>
        </li>
      {/each}
    </ul>
  </div>
</div>
