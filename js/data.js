// =====================================================
// 샘플 데이터 (탭 구분 TSV 형식)
// 구분1 | Device Name | ... | 26Y 3월 ~ 26Y 12월 | Netdie
// =====================================================
const SAMPLE_TSV = `구분1\tDevice Name\tBase Array\tWafer Name\tPKG type\tBody Size\tFAB\tDR\t담당자\t대리점\t고객\t지역\t26Y 3월\t26Y 4월\t26Y 5월\t26Y 6월\t26Y 7월\t26Y 8월\t26Y 9월\t26Y 10월\t26Y 11월\t26Y 12월\tNetdie
26년3월16일 변경\tMC97FG316RBN\tMC97FG316C\tMC97FG316C\t28_TSSOP\t173mil\tF-4\t0.18\t남궁윤\t(주)그린칩스\t노비타\t영업3팀\t\t\t\t\t\t\t\t\t\t\t8366
26년3월16일 변경\tMC97FG316RBN\tMC97FG316C\tMC97FG316C\t28_TSSOP\t173mil\tF-4\t0.18\t남궁윤\t(주)그린칩스\t세현테크놀러지\t영업3팀\t\t\t\t\t\t\t\t\t\t\t8366
26년3월16일 변경\tMC97FG316RBN\tMC97FG316C\tMC97FG316C\t28_TSSOP\t173mil\tF-4\t0.18\t남궁윤\t(주)그린칩스\t투에스텍\t영업3팀\t\t\t\t\t\t\t\t\t\t\t8366
26년3월16일 변경\tMC97FG316RBN\tMC97FG316C\tMC97FG316C\t28_TSSOP\t173mil\tF-4\t0.18\t남궁윤\t(주)그린칩스\t피엠에스\t영업3팀\t\t\t\t\t\t\t\t\t\t\t8366
26년3월16일 변경\tMC97FG316RBN\tMC97FG316C\tMC97FG316C\t28_TSSOP\t173mil\tF-4\t0.18\t남궁윤\t(주)실리콘기어\t성우전자\t영업3팀\t\t\t\t\t\t\t\t\t\t\t8366
26년3월16일 변경\tMC97FG316RBN\tMC97FG316C\tMC97FG316C\t28_TSSOP\t173mil\tF-4\t0.18\t남궁윤\t이데아아이앤씨주식회사\t언일전자\t영업3팀\t\t\t\t\t\t\t\t\t\t\t8366
26년3월16일 변경\tMC97FG316RBN\tMC97FG316C\tMC97FG316C\t28_TSSOP\t173mil\tF-4\t0.18\t남궁윤\t주식회사 새미칩스\t비티텔레콤\t영업3팀\t\t\t\t\t\t\t\t\t\t\t8366
26년3월16일 변경\tMC97FG316RBN\tMC97FG316C\tMC97FG316C\t28_TSSOP\t173mil\tF-4\t0.18\t이금란\tASCHIP\tQway\t법인\t\t48\t\t10\t\t\t30\t\t\t\t8366
26년3월16일 변경\tMC97FG316RBN\tMC97FG316C\tMC97FG316C\t28_TSSOP\t173mil\tF-4\t0.18\t이금란\tCCD\tHET\t법인\t\t\t\t\t\t\t\t\t\t\t8366
26년3월16일 변경\tMC97FG316RBN\tMC97FG316C\tMC97FG316C\t28_TSSOP\t173mil\tF-4\t0.18\t이금란\tCCD\tTjsiasun\t법인\t\t\t\t\t\t\t\t\t\t\t8366
26년3월16일 변경\tMC97FG316RBN\tMC97FG316C\tMC97FG316C\t28_TSSOP\t173mil\tF-4\t0.18\t이금란\tCHIPSRAIN\tHUIBI\t법인\t57\t16\t16\t21\t20\t10\t15\t15\t15\t10\t8366
26년3월16일 변경\tMCF6484-44L\tA96G150C\tA96G150C\t44_LQFP\t10x10-0.8\tF-4\t0.13\t이금란\tFST\tMIDEA MWO\t법인\t\t\t\t\t\t\t\t\t\t\t9454
26년3월16일 변경\tMCF6484-44L\tA96G150C\tA96G150C\t44_LQFP\t10x10-0.8\tF-4\t0.13\t이금란\tGRANDFE\tMIDEA MWO\t법인\t\t\t\t\t\t\t\t\t\t\t9454
26년3월16일 변경\tMCF6484-44LQFP\tA96G150C\tA96G150C-COLD\t44_LQFP\t10x10-0.8\tF-4\t0.13\t이금란\tFST\tMIDEA HAC\t법인\t67\t20\t20\t20\t30\t50\t60\t60\t60\t60\t9454
26년3월16일 변경\tMCF8014-32L\tMC97F8324HE\tMC97F8324HE\t32_LQFP_C/M\t7x7-0.8\tF-4\t0.18\t이금란\tFST\tMIDEA MWO\t법인\t355\t800\t800\t650\t650\t650\t700\t700\t700\t700\t7228
26년3월16일 변경\tMCF8014-32L\tMC97F8324HE\tMC97F8324HE\t32_LQFP_C/M\t7x7-0.8\tF-4\t0.18\t이금란\tGRANDFE\tMIDEA MWO\t법인\t\t\t\t\t\t\t\t\t\t\t7228
26년3월16일 변경\tMCF8014-32L\tMC97F8324HE\tMC97F8324HE\t32_LQFP_C/M\t7x7-0.8\tF-4\t0.18\t이금란\t(비어 있음)\t(비어 있음)\t법인\t300\t200\t\t\t\t\t\t\t\t\t7228
26년3월16일 변경\tPS9855\tPS9850R0\tPS9850R0\t68_QFN\t8x8x0.85T-0.4\tSMIC\t0.13\t나경문\tDirect\tLG HE\t영업2팀\t\t\t\t\t\t\t\t\t\t\t6176
26년3월16일 변경\tPS9860\tW9858PR2\tW9858PR2\t68_QFN\t8x8x0.85T-0.4\tSMIC\t0.13\t나경문\tDirect\tLG HE\t영업2팀\t78\t78\t78\t78\t78\t78\t78\t78\t78\t78\t4915
26년3월16일 변경\tPS9860\tW9858PR2\tW9858PR2\t68_QFN\t8x8x0.85T-0.4\tSMIC\t0.13\t남궁윤\t(주)그린칩스\tVTREK\t영업3팀\t\t\t\t\t\t\t\t\t\t\t4915
26년3월16일 변경\tSECAIR SCM02\tAL1113F\tAL1113F\t8_SOP(T)\t150mil\tF-4\t0.35\t남궁윤\t(주)그린칩스\t에프에스엔피플\t영업3팀\t\t\t\t\t\t\t40\t40\t40\t40\t24024
26년3월16일 변경\tSECAIR SCM02\tAL1113F\tAL1113F\t8_SOP(T)\t150mil\tF-4\t0.35\t이금란\tSECAIR\tSECAIR\t법인\t\t\t\t\t\t\t\t\t\t\t24024
26년3월16일 변경\tT8700A-QGF01(T)\tMC96F8204C\tMC96F8204C\t8_SOP(T)\t150mil\tF-4\t0.18\t남궁윤\to2solution\t테크레인\t영업3팀\t600\t600\t500\t400\t400\t400\t450\t450\t400\t400\t15068
26년3월16일 변경\tUEI1703X7CAE-PJF03(T)\tA96R136C\tA96R136C\t16_SOPN(T)\t150mil\tF-4\t0.18\t최헌제\tDirect\tC.G DEVELOPMENT LIMITED\t해외\t8\t30\t60\t91\t65\t65\t91\t109\t64\t30\t9424
26년3월16일 변경\tUEI1704CAU\tA96R150\tA96R150\t20_QFN\t4x4x0.75T-0.5\tF-4\t0.13\t이문정\tProgate\t삼성전자\t해외\t\t\t\t\t\t\t\t\t\t\t9646
26년3월16일 변경\tUEI1704CAU-PCF05(T)\tA96R150\tA96R150\t20_QFN(T)\t4x4x0.75T-0.5\tF-4\t0.13\t최헌제\tDirect\tC.G DEVELOPMENT LIMITED\t해외\t\t\t\t\t\t\t\t\t\t\t9646
26년3월16일 변경\tUEI1704CAU-PCF06(T)\tA96R150\tA96R150\t20_QFN(T)\t4x4x0.75T-0.5\tF-4\t0.13\t최헌제\tDirect\tC.G DEVELOPMENT LIMITED\t해외\t\t10\t\t10\t\t\t20\t\t\t\t9646
26년3월16일 변경\tZ51F3220FNX\tMC96F6432I\tMC96F6432I\t44_MQFP\t10x10-0.8\tF-4\t0.18\t이문정\tDirect\tIXYS Company\t해외\t\t\t\t\t\t\t\t\t\t\t6824
26년3월23일 변경\tA31C122FRN\tA31C122\tA31C122\t20_TSSOP\t173mil\tFAB-6\t0.07\t이재은\tDirect\tKDC/ONE\t해외\t\t\t\t\t\t\t\t\t\t\t12348
26년3월23일 변경\tA31C122KYN\tA31C122\tA31C122\t32_QFN\t5x5x0.75T-0.5\tFAB-6\t0.07\t이재은\tPhilips\tPhilips\t해외\t\t\t\t\t\t\t\t\t\t\t12348
26년3월23일 변경\tA31C144CLN\tA31C144\tA31C144\t48_LQFP\t7x7-0.5\tFAB-6\t0.07\t이금란\tCCD\tYIMI\t법인\t\t\t\t\t\t\t\t\t\t\t9280
26년3월23일 변경\tA31C144CLN\tA31C144\tA31C144\t48_LQFP\t7x7-0.5\tFAB-6\t0.07\t이금란\tGRANDFE\tKDP\t법인\t\t\t\t\t\t\t\t\t\t\t9280
26년3월23일 변경\tA31C144RN2N\tA31C144\tA31C144-105\t64_LQFP\t14x14-0.8\tFAB-6\t0.07\t이금란\tFST\tMIDEA MWO\t법인\t\t\t\t\t\t\t10\t10\t10\t10\t9280
26년3월23일 변경\tA31C144RN2N\tA31C144\tA31C144-105\t64_LQFP\t14x14-0.8\tFAB-6\t0.07\t이금란\tGRANDFE\tMIDEA MWO\t법인\t\t\t\t\t\t\t\t\t\t\t9280
26년3월23일 변경\tA31C144SN2N\tA31C144C\tA31C144C-105\t44_LQFP\t10x10-0.8\tFAB-6\t0.07\t이금란\tTHK\tDeye\t법인\t\t1\t\t5\t10\t10\t10\t10\t20\t20\t9280
26년3월23일 변경\tA31C156SNN\tA31C156\t#N/A\t#N/A\t#N/A\t(비어 있음)\t(비어 있음)\t이금란\tTHK\tDeye\t법인\t\t\t\t\t\t\t5\t5\t5\t5\t6940
26년3월23일 변경\tA31E012KNN\tA31G112G\tA31G112G-85\t32_LQFP_C/M\t7x7-0.8\tF-4\t0.13\t이금란\tMISSION\tCLICK\t법인\t\t\t\t\t\t\t\t\t\t\t7632
26년3월23일 변경\tA31G111LUN\tA31G112G\tA31G112G-85\t24_QFN\t4x4x0.75T-0.5\tF-4\t0.13\t남궁윤\t(주)그린칩스\t루나엔텍\t영업3팀\t\t\t\t\t\t\t\t\t\t\t7632
26년3월23일 변경\tA31G111LUN\tA31G112G\tA31G112G-85\t24_QFN\t4x4x0.75T-0.5\tF-4\t0.13\t남궁윤\t이데아아이앤씨주식회사\t언일전자\t영업3팀\t\t\t\t\t10\t10\t10\t10\t10\t\t7632
26년3월23일 변경\tA31G111LUN\tA31G112G\tA31G112G-85\t24_QFN\t4x4x0.75T-0.5\tF-4\t0.13\t남궁윤\t주식회사 세일테크놀러지\t삼원하이텍\t영업3팀\t5\t\t10\t10\t5\t5\t5\t5\t5\t5\t7632
26년3월23일 변경\tA31G111LUN\tA31G112G\tA31G112G-85\t24_QFN\t4x4x0.75T-0.5\tF-4\t0.13\t남궁윤\t주식회사 세일테크놀러지\t하나콘트롤\t영업3팀\t\t\t\t\t\t\t\t\t\t\t7632`;
