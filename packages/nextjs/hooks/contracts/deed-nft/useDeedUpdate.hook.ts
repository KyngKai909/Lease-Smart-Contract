import { useScaffoldContractWrite } from "../../scaffold-eth";
import { logger, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { TransactionReceipt } from "viem";
import { DeedInfoModel } from "~~/models/deed-info.model";
import { uploadDocuments } from "~~/services/document.service";
import { notification } from "~~/utils/scaffold-eth";

const useDeedUpdate = (onConfirmed?: (txnReceipt: TransactionReceipt) => void) => {
  const { primaryWallet, authToken } = useDynamicContext();

  const contractWriteHook = useScaffoldContractWrite({
    contractName: "DeedNFT",
    functionName: "setIpfsDetailsHash",
    args: [] as any, // Will be filled in by write()
    onBlockConfirmation: onConfirmed,
    account: primaryWallet?.address,
  });

  const writeAsync = async (data: DeedInfoModel, old: DeedInfoModel, deedId: number) => {
    if (!primaryWallet || !authToken) {
      notification.error("No wallet connected");
      return;
    }

    let toastId = notification.loading("Uploading documents...");
    let hash;
    try {
      hash = await uploadDocuments(authToken, data, old);
    } catch (error) {
      notification.error("Error while uploading documents");
      logger.error({ message: "[Deed Mint] Error while uploading documents", error });
      return null;
    } finally {
      notification.remove(toastId);
    }
    if (!hash) return;

    toastId = notification.info("Updating deed...", {
      duration: Infinity,
    });
    try {
      await contractWriteHook.writeAsync({
        args: [BigInt(deedId), hash],
      });
    } catch (error) {
      notification.error("Error while minting deed");
      logger.error({ message: "Error while minting deed", error });
      return;
    } finally {
      notification.remove(toastId);
    }
  };

  return { ...contractWriteHook, writeAsync };
};
export default useDeedUpdate;
