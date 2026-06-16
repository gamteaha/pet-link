"use client";

import React, { useState } from "react";
import Link from "next/link";
import Character3D from "../components/Character3D";
import Character2D from "../components/Character2D";
import CustomPet from "../components/CustomPet";

// Colors for the palettes
const OUTFIT_COLORS = ['#c44933', '#e8ab48', '#b5d5a4', '#a1adc8', '#d4b7d5', '#ebb1b1'];
const BACKPACK_COLORS = ['#c44933', '#e8ab48', '#b5d5a4', '#a1adc8', '#d4b7d5', '#ebb1b1'];
const GLASSES_COLORS = ['#1a1a1a', '#e0e0e0', '#ffd700', '#c44933', '#4a6fa5', '#d4b7d5'];

const CATEGORIES = [
  { id: 'basic', label: '기본' },
  { id: 'face', label: '얼굴' },
  { id: 'hair', label: '헤어' },
  { id: 'outfit', label: '의상' },
  { id: 'acc', label: '소품' },
];

export default function CustomizePage() {
  const [isMounted, setIsMounted] = useState(false);
  
  // Initial state setup with lazy evaluation from localStorage
  const [name, setName] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).name || "";
    }
    return "";
  });
  const [activeTab, setActiveTab] = useState('basic');
  const [viewMode, setViewMode] = useState<'3D' | '2D'>(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).viewMode || '3D';
    }
    return '3D';
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [hairColorValue, setHairColorValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).hairColorValue || 15;
    }
    return 15;
  });
  const [hairLightnessValue, setHairLightnessValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).hairLightnessValue || 50;
    }
    return 50;
  }); // Brightness 0-100
  const [skinToneValue, setSkinToneValue] = useState(() => {
    if (typeof window !== 'undefined') {
  const [skinToneValue, setSkinToneValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).skinToneValue || 30;
    }
    return 30;
  });
  const [outfitColor, setOutfitColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).outfitColor || OUTFIT_COLORS[1];
    }
    return OUTFIT_COLORS[1];
  });
  const [backpackColor, setBackpackColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).backpackColor || BACKPACK_COLORS[2];
    }
    return BACKPACK_COLORS[2];
  });

  // New categorical states mapped to Character3D component
  const [backHairIndex, setBackHairIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).backHairIndex || 1;
    }
    return 1;
  });
  const [frontHairIndex, setFrontHairIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).frontHairIndex || 2;
    }
    return 2;
  }); // default bangs
  const [bodyType, setBodyType] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).bodyType || 1;
    }
    return 1;
// MISSING 101
// MISSING 102
// MISSING 103
// MISSING 104
// MISSING 105
// MISSING 106
// MISSING 107
// MISSING 108
// MISSING 109
// MISSING 110
// MISSING 111
// MISSING 112
// MISSING 113
// MISSING 114
// MISSING 115
// MISSING 116
// MISSING 117
    }
    return 1;
  });
  const [outfitStyle, setOutfitStyle] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).outfitStyle || 1;
    }
    return 1;
  });
  const [hatType, setHatType] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).hatType || 2;
    }
    return 2;
  }); // Start with mushroom hat
  const [glassesType, setGlassesType] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).glassesType || 1;
    }
    return 1;
  }); // 1: None, 2: Round, 3: Square, 4: Rectangular
  const [glassesColor, setGlassesColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).glassesColor || GLASSES_COLORS[0];
    }
    return GLASSES_COLORS[0];
  });
  const [backpackType, setBackpackType] = useState(() => {
  });
  const [backpackType, setBackpackType] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).backpackType || 2;
    }
    return 2;
  }); // 1: None, 2: Backpack, 3: Handbag

  // 현재 커스텀 설정 객체
  const currentConfig = {
    name, viewMode, skinToneValue, bodyType, eyeType, mouthType, blushType,
    frontHairIndex, backHairIndex, hairColorValue, hairLightnessValue,
    outfitStyle, outfitColor, hatType, backpackType, backpackColor, glassesType, glassesColor
  };

  // 설정이 바뀔 때마다 자동 저장
  React.useEffect(() => {
    if (isMounted) {
      localStorage.setItem('petLink_draftCustomPet', JSON.stringify(currentConfig));
    }
  }, [isMounted, name, viewMode, skinToneValue, bodyType, eyeType, mouthType, blushType, frontHairIndex, backHairIndex, hairColorValue, hairLightnessValue, outfitStyle, outfitColor, hatType, backpackType, backpackColor, glassesType, glassesColor]);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen bg-[#ff9b49]" />;
  }

  // Derived colors
  const hairColorHSL = `hsl(${hairColorValue * 3.6}, 70%, ${hairLightnessValue}%)`;

  const getSkinColor = (val: number) => {
    const r = Math.round(255 - (255 - 74) * (val / 100));
    const g = Math.rou
// MISSING 187
// MISSING 188
// MISSING 189
// MISSING 190
// MISSING 191
// MISSING 192
// MISSING 193
// MISSING 194
// MISSING 195
// MISSING 196
// MISSING 197
// MISSING 198
// MISSING 199
// MISSING 200
// MISSING 201
// MISSING 202
// MISSING 203
// MISSING 204
// MISSING 205
// MISSING 206
// MISSING 207
// MISSING 208
// MISSING 209
// MISSING 210
// MISSING 211
// MISSING 212
// MISSING 213
// MISSING 214
// MISSING 215
// MISSING 216
// MISSING 217
// MISSING 218
// MISSING 219
// MISSING 220
// MISSING 221
// MISSING 222
// MISSING 223
// MISSING 224
// MISSING 225
// MISSING 226
// MISSING 227
// MISSING 228
// MISSING 229
// MISSING 230
// MISSING 231
// MISSING 232
// MISSING 233
// MISSING 234
// MISSING 235
// MISSING 236
// MISSING 237
// MISSING 238
// MISSING 239
// MISSING 240
// MISSING 241
// MISSING 242
// MISSING 243
// MISSING 244
// MISSING 245
// MISSING 246
// MISSING 247
// MISSING 248
// MISSING 249
// MISSING 250
// MISSING 251
// MISSING 252
// MISSING 253
// MISSING 254
// MISSING 255
// MISSING 256
// MISSING 257
// MISSING 258
// MISSING 259
// MISSING 260
// MISSING 261
// MISSING 262
// MISSING 263
// MISSING 264
// MISSING 265
// MISSING 266
// MISSING 267
// MISSING 268
// MISSING 269
// MISSING 270
// MISSING 271
// MISSING 272
// MISSING 273
// MISSING 274
// MISSING 275
// MISSING 276
// MISSING 277
// MISSING 278
// MISSING 279
// MISSING 280
// MISSING 281
// MISSING 282
// MISSING 283
// MISSING 284
// MISSING 285
// MISSING 286
// MISSING 287
// MISSING 288
// MISSING 289
// MISSING 290
// MISSING 291
// MISSING 292
// MISSING 293
// MISSING 294
// MISSING 295
// MISSING 296
// MISSING 297
// MISSING 298
// MISSING 299
// MISSING 300
// MISSING 301
// MISSING 302
// MISSING 303
// MISSING 304
// MISSING 305
// MISSING 306
// MISSING 307
// MISSING 308
// MISSING 309
// MISSING 310
// MISSING 311
// MISSING 312
// MISSING 313
// MISSING 314
// MISSING 315
// MISSING 316
// MISSING 317
// MISSING 318
// MISSING 319
// MISSING 320
// MISSING 321
// MISSING 322
// MISSING 323
// MISSING 324
// MISSING 325
// MISSING 326
// MISSING 327
// MISSING 328
// MISSING 329
// MISSING 330
// MISSING 331
// MISSING 332
// MISSING 333
// MISSING 334
// MISSING 335
// MISSING 336
// MISSING 337
// MISSING 338
// MISSING 339
// MISSING 340
// MISSING 341
// MISSING 342
// MISSING 343
// MISSING 344
// MISSING 345
// MISSING 346
// MISSING 347
// MISSING 348
// MISSING 349
// MISSING 350
// MISSING 351
// MISSING 352
// MISSING 353
// MISSING 354
// MISSING 355
// MISSING 356
// MISSING 357
// MISSING 358
// MISSING 359
// MISSING 360
// MISSING 361
// MISSING 362
// MISSING 363
// MISSING 364
// MISSING 365
// MISSING 366
// MISSING 367
// MISSING 368
// MISSING 369
// MISSING 370
// MISSING 371
// MISSING 372
// MISSING 373
// MISSING 374
// MISSING 375
// MISSING 376
// MISSING 377
// MISSING 378
// MISSING 379
// MISSING 380
// MISSING 381
// MISSING 382
// MISSING 383
// MISSING 384
// MISSING 385
// MISSING 386
// MISSING 387
// MISSING 388
// MISSING 389
// MISSING 390
// MISSING 391
// MISSING 392
// MISSING 393
// MISSING 394
// MISSING 395
// MISSING 396
// MISSING 397
// MISSING 398
// MISSING 399
// MISSING 400
// MISSING 401
// MISSING 402
// MISSING 403
// MISSING 404
// MISSING 405
// MISSING 406
// MISSING 407
// MISSING 408
// MISSING 409
// MISSING 410
// MISSING 411
// MISSING 412
// MISSING 413
// MISSING 414
// MISSING 415
// MISSING 416
// MISSING 417
// MISSING 418
// MISSING 419
// MISSING 420
// MISSING 421
// MISSING 422
// MISSING 423
// MISSING 424
// MISSING 425
// MISSING 426
// MISSING 427
// MISSING 428
// MISSING 429
// MISSING 430
// MISSING 431
// MISSING 432
// MISSING 433
// MISSING 434
// MISSING 435
// MISSING 436
// MISSING 437
// MISSING 438
// MISSING 439
// MISSING 440
// MISSING 441
// MISSING 442
// MISSING 443
// MISSING 444
// MISSING 445
// MISSING 446
// MISSING 447
// MISSING 448
// MISSING 449
// MISSING 450
// MISSING 451
// MISSING 452
// MISSING 453
// MISSING 454
// MISSING 455
// MISSING 456
// MISSING 457
// MISSING 458
// MISSING 459
// MISSING 460
// MISSING 461
// MISSING 462
// MISSING 463
// MISSING 464
// MISSING 465
// MISSING 466
// MISSING 467
// MISSING 468
// MISSING 469
// MISSING 470
// MISSING 471
// MISSING 472
// MISSING 473
// MISSING 474
// MISSING 475
// MISSING 476
// MISSING 477
// MISSING 478
// MISSING 479
// MISSING 480
// MISSING 481
// MISSING 482
// MISSING 483
// MISSING 484
// MISSING 485
// MISSING 486
// MISSING 487
// MISSING 488
// MISSING 489
// MISSING 490
// MISSING 491
// MISSING 492
// MISSING 493
// MISSING 494
// MISSING 495
// MISSING 496
// MISSING 497
// MISSING 498
// MISSING 499
// MISSING 500
// MISSING 501
// MISSING 502
// MISSING 503
// MISSING 504
// MISSING 505
// MISSING 506
// MISSING 507
// MISSING 508
// MISSING 509
// MISSING 510
// MISSING 511
// MISSING 512
// MISSING 513
// MISSING 514
// MISSING 515
// MISSING 516
// MISSING 517
// MISSING 518
// MISSING 519
// MISSING 520
// MISSING 521
// MISSING 522
// MISSING 523
// MISSING 524
// MISSING 525
// MISSING 526
// MISSING 527
// MISSING 528
// MISSING 529
// MISSING 530
// MISSING 531
// MISSING 532
// MISSING 533
// MISSING 534
// MISSING 535
// MISSING 536
// MISSING 537
// MISSING 538
// MISSING 539
// MISSING 540
// MISSING 541
// MISSING 542
// MISSING 543
// MISSING 544
// MISSING 545
// MISSING 546
// MISSING 547
// MISSING 548
// MISSING 549
// MISSING 550
// MISSING 551
// MISSING 552
// MISSING 553
// MISSING 554
// MISSING 555
// MISSING 556
// MISSING 557
// MISSING 558
// MISSING 559
// MISSING 560
// MISSING 561
// MISSING 562
// MISSING 563
// MISSING 564
// MISSING 565
// MISSING 566
// MISSING 567
// MISSING 568
                          key={type.id}
                          onClick={() => setGlassesType(type.id)}
                          className={`px-6 py-3 rounded-2xl font-bold text-xl border-[4px] border-[#4a2e1b] hover:scale-110 transition-transform ${glassesType === type.id ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-6">
                    <span className="tracking-wide">안경 색상 (Glasses Colour):</span>
                    <div className="flex gap-4 flex-wrap">
                      {GLASSES_COLORS.map((color, i) => (
                        <button
                          key={i}
                          onClick={() => setGlassesColor(color)}
                          style={{ backgroundColor: color }}
                          className={`w-14 h-14 rounded-2xl border-[#4a2e1b] border-[4px] shadow-sm hover:scale-110 transition-transform ${glassesColor === color ? 'ring-4 ring-[#4a2e1b]/30' : ''}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-6">
                    <span className="tracking-wide">가방 종류 (Bag Type):</span>
                    <div className="flex gap-4 flex-wrap">
                      {[
                        { id: 1, label: '없음' },
                        { id: 2, label: '백팩' },
                        { id: 3, label: '손가방' }
                      ].map((type) => (
// MISSING 601
// MISSING 602
// MISSING 603
// MISSING 604
// MISSING 605
// MISSING 606
// MISSING 607
// MISSING 608
// MISSING 609
// MISSING 610
// MISSING 611
// MISSING 612
// MISSING 613
// MISSING 614
// MISSING 615
// MISSING 616
// MISSING 617
// MISSING 618
// MISSING 619
// MISSING 620
            {/* Add to Cart Button */}
            <button
              onClick={() => {
                const config = {
                  ...currentConfig,
                  id: Date.now(),
                  name: name || '이름 없는 펫'
                };
                // Get existing cart or empty array
                const existingCart = JSON.parse(localStorage.getItem('petLink_cart') || '[]');
                existingCart.push(config);
                localStorage.setItem('petLink_cart', JSON.stringify(existingCart));

                // Also save as the active preview pet
                localStorage.setItem('petLink_customPet', JSON.stringify(config));

                window.location.href = '/cart';
              }}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-12 py-5 bg-[#d8e2b8] hover:bg-[#c5d19d] border-[#4a2e1b] border-[6px] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all group cursor-pointer z-20 w-max"
            >
              <span className="text-[#4a2e1b] font-black text-2xl tracking-wide flex items-center gap-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                장바구니에 담기
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 미리보기 펫 렌더링 */}
      {isPreviewing && (
        <CustomPet previewConfig={currentConfig} />
      )}
    </div>
  );
}


