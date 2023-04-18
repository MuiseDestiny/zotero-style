const field2Info: any = {
  sci(s: string) {
    let rank;
    let key = "SCI", value = s;
    if (s == "Q1") {
      rank = 1
    } else if (s == "Q2") {
      rank = 2
    } else if (s == "Q3") {
      rank = 3
    } else if (s == "Q4") {
      rank = 4
    }
    return { rank, key, value}
  },
  sciif(s: string) {
    let key = "SCIIF", value = s;
    let number = Number(s);
    let rank
    if (number >= 10) {
      rank = 1
    } else if (number >= 4 && number < 10) {
      rank = 2
    } else if (number >= 2 && number < 4) {
      rank = 3
    } else if (number >= 1 && number < 2) {
      rank = 4
    } else if (number >= 0 && number < 1) {
      rank = 5
    }
    return {rank, key, value}
  },
  sciif5(s: string) {
    let number = parseFloat(s);
    let key = "SCIIF(5)", value = s;
    let rank
    if (number >= 10) {
      rank = 1
    } else if (number >= 4 && number < 10) {
      rank = 2
    } else if (number >= 2 && number < 4) {
      rank = 3
    } else if (number >= 1 && number < 2) {
      rank = 4
    } else if (number >= 0 && number < 1) {
      rank = 5
    }
    return { rank, key, value }
  },
  sciBase(s: string) {
    let key = "SCI基础版", value = s;
    s = s.substring(s.length - 2);
    let rank
    if (s == "1区") {
      rank = 1
    } else if (s == "2区") {
      rank = 2
    } else if (s == "3区") {
      rank = 3
    } else if (s == "4区") {
      rank = 4
    }
    return { rank, key, value }
  },
  sciUp(s: string) {
    let key = "SCI升级版", value = s;
    s = s.substring(s.length - 2);
    let rank
    if (s == "1区") {
      rank = 1
    } else if (s == "2区") {
      rank = 2
    } else if (s == "3区") {
      rank = 3
    } else if (s == "4区") {
      rank = 4
    }
    return {rank, key, value}
  },
  ssci(s: string) {
    let key = "SSCI", value = s
    let rank
    if (s == "Q1") {
      rank = 1
    } else if (s == "Q2") {
      rank = 2
    } else if (s == "Q3") {
      rank = 3
    } else if (s == "Q4") {
      rank = 4
    } else if (s == "SSCI") {
      rank = 5
    }
    return {rank, key, value}
  },
  eii(s: string) {
    let key = "EI检索", value = "";
    let rank = 2
    return { rank, key, value: ""}
  },
  cssci(s: string) {
    let key = s, value = "";
    let rank
    if (s == "CSSCI") {
      rank = 1
    } else if (s == "CSSCI扩展版") {
      rank = 2
    }
    return {rank, key, value}
  },
  nju(s: string) {
    let key = "NJU", value = s;
    let rank
    if (s == "超一流期刊" || s == "学科群一流期刊") {
      rank = 1
    } else if (s == "A") {
      rank = 2
    } else if (s == "B") {
      rank = 3
    }
    return {rank, key, value}
  },
  pku(s: string) {
    let key = "北大中文核心", value = ""
    let rank = 1
    return { rank, key, value }
  },
  xju(s: string) {
    let key = "XJU", value = s;
    let rank
    if (s == "一区") {
      rank = 1
    } else if (s == "二区") {
      rank = 2
    } else if (s == "三区") {
      rank = 3
    } else if (s == "四区") {
      rank = 4
    } else if (s == "五区") {
      rank = 5
    } 
    return {rank, key, value}
  },
  ccf(s: string) {
    let key = "CCF", value=s
    let rank
    if (s == "A") {
      rank = 1;
    } else if (s == "B") {
      rank = 2;
    } else if (s == "C") {
      rank = 3;
    } else if (s == "T1") {
      rank = 1;
    } else if (s == "T2") {
      rank = 2;
    } else if (s == "T3") {
      rank = 3;
    }
    return {rank, key, value}
  },
  ahci(s: string) {
    let rank = 2
    let key = "A&HCI 检索"
    let value = ""
    return { rank, key, value }
  },
  ajg(s: string) {
    let key = "AJG", value = s
    let rank
    if (s == "4*") {
      rank = 1;
    } else if (s == "4") {
      rank = 2;
    } else if (s == "3") {
      rank = 3
    } else if (s == "2") {
      rank = 4
    } else if (s == "1") {
      rank = 5
    }
    return {rank, key, value}
  },
  cqu(s: string) {
    let key = "CQU"
    let value = s
    let rank
    if (s == "A" || s == "权威期刊") {
      rank = 2
    } else if (s == "B" || s == "重要期刊") {
      rank = 3
    } else if (s == "C") {
      rank = 4
    }
    return { rank, key, value }
  },
  cscd(s: string) {
    let key = "CSCD", value = s;
    let rank
    if (s == "扩展库") {
      rank = 3
    } else if (s == "核心库") {
      rank = 2
    }
    return { rank, key, value }
  },
  cufe(s: string) {
    let key = "CUFE", value = s;
    let rank
    if (s == "AAA") {
      rank = 2
    } else if (s == "AA") {
      rank = 3
    } else if (s == "A") {
      rank = 4
    }
    return { rank, key, value }

  },
  cug(s: string) {
    let key = "CUG", value = s;
    let rank
    s = s.substring(s.length - 2);
    if (s == "T1") {
      rank = 1
    } else if (s == "T2") {
      rank = 2
    } else if (s == "T3") {
      rank = 3
    } else if (s == "T4") {
      rank = 4
    } else if (s == "T5") {
      rank = 5
    }
    return { rank, key, value }
  },
  fdu(s: string) {
    let key = "FDU", value = s
    let rank
    if (s == "A") {
      rank = 2
    } else if (s == "B") {
      rank = 3
    }
    return { rank, key, value }
  },
  hhu(s: string) {
    let key = "HHU", value = s;
    let rank
    if (s == "A类") {
      rank = 1
    } else if (s == "B类") {
      rank = 2
    } else if (s == "c类") {
      rank = 3
    }
    return { rank, key, value }
  },
  ruc(s: string) {
    let key = "RUC", value = s;
    let rank
    if (s == "A+") {
      rank = 1
    } else if (s == "A") {
      rank = 2
    } else if (s == "A-") {
      rank = 3
    } else if (s == "B") {
      rank = 4
    }
    return { rank, key, value }
  },
  jci(s: string) {
    let key = "JCI", value = s;
    let rank
    let number = parseFloat(s);
    if (number >= 3) {
      rank = 1
    } else if (number >= 1 && number < 3) {
      rank = 2
    } else if (number >= 0.5 && number < 1) {
      rank = 3
    } else if (number >= 0 && number < 0.5) {
      rank = 4
    }
    return { rank, key, value }
  },
  sdufe(s: string) {
    let key = "SDUFE", value = s;
    let rank
    if (s == "特类期刊") {
      rank = 1
    } else if (s == "A1") {
      rank = 2
    } else if (s == "A2") {
      rank = 3
    } else if (s == "B") {
      rank = 4
    } else if (s == "C") {
      rank = 5
    }
    return { rank, key, value }
  },
  sjtu(s: string) {
    let key = "SJTU", value = s;
    let rank
    if (s == "A") {
      rank = 2
    } else if (s == "B") {
      rank = 3
    }
    return { rank, key, value }

  },
  swjtu(s: string) {
    let key = "SWJTU", value = s;
    let rank
    if (s == "A++") {
      rank = 1
    } else if (s == "A+") {
      rank = 2
    } else if (s == "A") {
      rank = 3
    } else if (s == "B+") {
      rank = 4
    } else if (s == "B") {
      rank = 5
    } else if (s == "C") {
      rank = 5
    }
    return { rank, key, value }
  },
  uibe(s: string) {
    let key = "UIBE", value = s;
    let rank
    if (s == "A") {
      rank = 1
    } else if (s == "A-") {
      rank = 2
    } else if (s == "B") {
      rank = 3
    }
    return { rank, key, value }
  },
  xmu(s: string) {
    let key, value;
    let rank
    if (s == "XMU一类") {
      key = s
      value = ""
      rank = 2
    }
    return { rank, key, value }
  },
  xdu(s: string) {
    let key = "XDU", value = s;
    let rank
    if (s == "1类贡献度") {
      rank = 1
    } else if (s == "2类贡献度") {
      rank = 2
    }
    return { rank, key, value }
  },
  zhongguokejihexin(s: string) {
    let key, value, rank
    if (s == "中国科技核心期刊") {
      rank = 1
      key = s
      value = ""
    }
    return { rank, key, value }
  },
  fms(s: string) {
    let key = "FMS", value = s;
    let rank
    if (s == "A" || s == "T1") {
      rank = 1
    } else if (s == "B" || s == "T2") {
      rank = 2
    } else if (s == "C") {
      rank = 3
    } else if (s == "D") {
      rank = 4
    }
    return { rank, key, value }
  },
  scu(s: string) {
    let key = "SCU", value = s;
    let rank
    s = s.slice(-1);
    if (s == "A") {
      rank = 1
    } else if (s == "-") {
      rank = 2
    } else if (s == "B") {
      rank = 3
    } else if (s == "C") {
      rank = 4
    } else if (s == "D") {
      rank = 5
    } else if (s == "E") {
      rank = 5
    }
    return { rank, key, value }
  },
  sciwarn(s: string) {
    let key = "SCIWARN", value = s, rank = 1
    return { rank, key, value }
  },
  zju(s: string) {
    if (s == "国内一级学术期刊") {
      s = "国内一级";
    } else if (s == "国内核心期刊") {
      s = "国内核心";
    }
    let key = "ZJU", value = s
    let rank

    if (s == "国内一级") {
      rank = 1
    } else if (s == "国内核心") {
      rank = 2
    }
    return { rank, key, value }
  },
  cju(s: string) {
    let key = "YangtzeU", value = s;
    let rank
    s = s.slice(0, 2);
    if (s == "T1") {
      rank = 1
    } else if (s == "T2") {
      rank = 2
    } else if (s == "T3") {
      rank = 3
    }
    return { rank, key, value }
  },
  ft50(s: string) {
    let key, value, rank
    if (s == "FT50") {
      key = "FT50"
      value = ""
      rank = 1
    }
    return { rank, key, value }
  },
  utd24(s: string) {
    let key, value, rank
    if (s == "UTD24") {
      key = "UTD24"
      value = ""
      rank = 1
    }
    return { rank, key, value }
  },
  CPU(s: string) {
    let key = "CPU", value = s, rank
    if (s == "一流") {
      rank = 1
    } else if (s == "权威") {
      rank = 2
    } else if (s == "学科顶尖") {
      rank = 3
    } else if (s == "学科一流") {
      rank = 4
    } else if (s == "学科重要") {
      rank = 5
    }
    return { rank, key, value }
  }
}

export default field2Info