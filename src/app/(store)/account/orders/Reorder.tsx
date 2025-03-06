"use client";
import { StatusButton } from "../../../../components/button/StatusButton";
import { useCart } from "../../../../react-shopper-hooks";

export type ReorderProps = {
  orderId: string;
};

export function Reorder({ orderId }: ReorderProps) {
  const { useScopedReorderToCart } = useCart();
  const { mutate: mutateReorder, isPending: isPendingReorder } =
    useScopedReorderToCart();

  const handleReorder = async () => {
    mutateReorder({
      data: {
        type: "order_items",
        order_id: orderId,
      },
      options: {
        add_all_or_nothing: false,
      },
    });
  };

  return (
    <div className="flex gap-5 w-full py-5 ">
      <div className="flex flex-1 flex-col gap-y-1.5"></div>
      <div className="flex flex-col sm:flex">
        <StatusButton
          onClick={handleReorder}
          className="text-sm py-2"
          status={isPendingReorder ? "loading" : "idle"}
        >
          Reorder
        </StatusButton>
      </div>
    </div>
  );
}
