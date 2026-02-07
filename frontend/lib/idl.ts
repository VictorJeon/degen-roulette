import type { Idl } from "@coral-xyz/anchor";

export const IDL: Idl = {
  "address": "98RABzywqR9v33GmioVFeFrapM1LC5RiwmJbXdEPvx59",
  "metadata": {
    "name": "degen_roulette_v2",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Degen Roulette V2 - Provably Fair Russian Roulette on Solana"
  },
  "instructions": [
    {
      "name": "force_settle",
      "discriminator": [
        201,
        10,
        239,
        245,
        47,
        198,
        225,
        204
      ],
      "accounts": [
        {
          "name": "player",
          "docs": [
            "Player who started the game"
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "game"
          ]
        },
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "house_vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "house_config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "player_stats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "fund_house",
      "discriminator": [
        175,
        231,
        49,
        44,
        144,
        102,
        41,
        69
      ],
      "accounts": [
        {
          "name": "house_config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "house_vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "funder",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize_house",
      "discriminator": [
        180,
        46,
        86,
        125,
        135,
        107,
        214,
        28
      ],
      "accounts": [
        {
          "name": "house_config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "house_vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "pause",
      "discriminator": [
        211,
        22,
        221,
        251,
        74,
        121,
        193,
        47
      ],
      "accounts": [
        {
          "name": "house_config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "house_config"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "settle_game",
      "discriminator": [
        96,
        54,
        24,
        189,
        239,
        198,
        86,
        29
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "House authority — must match house_config.authority"
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "house_config"
          ]
        },
        {
          "name": "house_config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "house_vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "player",
          "writable": true
        },
        {
          "name": "player_stats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "rounds_survived",
          "type": "u8"
        },
        {
          "name": "server_seed",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "start_game",
      "discriminator": [
        249,
        47,
        252,
        172,
        184,
        162,
        245,
        14
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "house_config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "house_vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "player_stats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "bet_amount",
          "type": "u64"
        },
        {
          "name": "seed_hash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "unpause",
      "discriminator": [
        169,
        144,
        4,
        38,
        10,
        141,
        188,
        255
      ],
      "accounts": [
        {
          "name": "house_config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "house_config"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "update_config",
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "house_config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "house_config"
          ]
        }
      ],
      "args": [
        {
          "name": "min_bet",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "max_bet_pct",
          "type": {
            "option": "u16"
          }
        },
        {
          "name": "house_edge_bps",
          "type": {
            "option": "u16"
          }
        }
      ]
    },
    {
      "name": "withdraw_house",
      "discriminator": [
        226,
        236,
        222,
        156,
        198,
        230,
        70,
        147
      ],
      "accounts": [
        {
          "name": "house_config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "house_vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "house_config"
          ]
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "GameState",
      "discriminator": [
        144,
        94,
        208,
        172,
        248,
        99,
        134,
        120
      ]
    },
    {
      "name": "HouseConfig",
      "discriminator": [
        194,
        237,
        216,
        79,
        135,
        254,
        7,
        212
      ]
    },
    {
      "name": "HouseVault",
      "discriminator": [
        125,
        17,
        104,
        101,
        16,
        34,
        39,
        135
      ]
    },
    {
      "name": "PlayerStats",
      "discriminator": [
        169,
        146,
        242,
        176,
        102,
        118,
        231,
        172
      ]
    }
  ],
  "events": [
    {
      "name": "GameSettled",
      "discriminator": [
        63,
        109,
        128,
        85,
        229,
        63,
        167,
        176
      ]
    },
    {
      "name": "GameStarted",
      "discriminator": [
        222,
        247,
        78,
        255,
        61,
        184,
        156,
        41
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "HousePaused",
      "msg": "House is currently paused"
    },
    {
      "code": 6001,
      "name": "BetTooLow",
      "msg": "Bet amount below minimum"
    },
    {
      "code": 6002,
      "name": "BetTooHigh",
      "msg": "Bet amount exceeds maximum (percentage of house vault)"
    },
    {
      "code": 6003,
      "name": "InsufficientHouseBalance",
      "msg": "Insufficient house vault balance"
    },
    {
      "code": 6004,
      "name": "GameNotActive",
      "msg": "Game is not active"
    },
    {
      "code": 6005,
      "name": "InvalidGameStatus",
      "msg": "Invalid game status"
    },
    {
      "code": 6006,
      "name": "InvalidConfig",
      "msg": "Invalid configuration parameter"
    },
    {
      "code": 6007,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6008,
      "name": "InvalidRoundsSurvived",
      "msg": "Invalid rounds survived (must be 1-5)"
    },
    {
      "code": 6009,
      "name": "InvalidServerSeed",
      "msg": "Server seed does not match committed hash"
    },
    {
      "code": 6010,
      "name": "GameAlreadySettled",
      "msg": "Game already settled"
    },
    {
      "code": 6011,
      "name": "GameNotExpired",
      "msg": "Game has not expired yet (1h timeout required)"
    },
    {
      "code": 6012,
      "name": "GameAlreadyActive",
      "msg": "Game already active"
    }
  ],
  "types": [
    {
      "name": "GameSettled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "bet_amount",
            "type": "u64"
          },
          {
            "name": "rounds_survived",
            "type": "u8"
          },
          {
            "name": "bullet_position",
            "type": "u8"
          },
          {
            "name": "won",
            "type": "bool"
          },
          {
            "name": "payout",
            "type": "u64"
          },
          {
            "name": "multiplier",
            "type": "u16"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "GameStarted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "bet_amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "GameState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "bet_amount",
            "type": "u64"
          },
          {
            "name": "seed_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "rounds_survived",
            "type": "u8"
          },
          {
            "name": "bullet_position",
            "type": "u8"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "GameStatus"
              }
            }
          },
          {
            "name": "result_multiplier",
            "type": "u16"
          },
          {
            "name": "payout",
            "type": "u64"
          },
          {
            "name": "created_at",
            "type": "i64"
          },
          {
            "name": "settled_at",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "GameStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Idle"
          },
          {
            "name": "Active"
          },
          {
            "name": "Won"
          },
          {
            "name": "Lost"
          },
          {
            "name": "Cancelled"
          }
        ]
      }
    },
    {
      "name": "HouseConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "min_bet",
            "type": "u64"
          },
          {
            "name": "max_bet_pct",
            "type": "u16"
          },
          {
            "name": "house_edge_bps",
            "type": "u16"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "total_games",
            "type": "u64"
          },
          {
            "name": "total_volume",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "HouseVault",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "PlayerStats",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "total_games",
            "type": "u64"
          },
          {
            "name": "total_wagered",
            "type": "u64"
          },
          {
            "name": "total_won",
            "type": "u64"
          },
          {
            "name": "total_profit",
            "type": "i64"
          },
          {
            "name": "best_streak",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
