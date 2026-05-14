<script lang="ts">
  interface Props {
    notes: string
  }
  let { notes }: Props = $props()
</script>

<div class="c-footer">
  <span class="tag">notes</span>{notes}
</div>
